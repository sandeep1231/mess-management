import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { Member } from '../models/Member';
import { Types } from 'mongoose';
import { asyncHandler } from './middleware';
import { requireAdmin, requireAuth } from './authMiddleware';

export const authRouter = Router();

const registerSchema = z.union([
  z.object({ phone: z.string().min(6), password: z.string().min(6), role: z.enum(['admin','user']).optional() }),
  z.object({ email: z.string().min(3), password: z.string().min(6), role: z.enum(['admin','user']).optional() }), // legacy support: treat email as phone input
]);
const loginSchema = registerSchema;

function signToken(userId: string, role: 'admin' | 'user') {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  return jwt.sign({ sub: userId, role }, secret, { expiresIn: '7d' });
}

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.parse(req.body) as any;
    const phone = (parsed.phone ?? parsed.email) as string;
    const password = parsed.password as string;
    const requestedRole = (parsed.role as 'admin'|'user'|undefined) || 'user';
    const existing = await User.findOne({ phone });
    if (existing) return res.status(409).json({ error: 'Phone already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    // Determine role: allow 'admin' only if first user in system
    const total = await User.countDocuments();
    const role: 'admin' | 'user' = total === 0 && requestedRole === 'admin' ? 'admin' : 'user';
    const approved = role === 'admin'; // auto-approve admin/first user
    const user = await User.create({ phone, passwordHash, approved, role });
    if (approved) {
      const token = signToken(user.id, role);
      return res.status(201).json({ token, role, approved });
    }
    // Not approved yet; no token is issued
    res.status(201).json({ approved });
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.parse(req.body) as any;
    const phone = (parsed.phone ?? parsed.email) as string;
    const password = parsed.password as string;
    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.approved) return res.status(403).json({ error: 'Not approved by admin yet' });
    const role: 'admin' | 'user' = user.role || 'user';
    const token = signToken(user.id, role);
    res.json({ token, role });
  }),
);

// Current user profile
authRouter.get(
  '/me',
  requireAuth,
  async (req, res) => {
    const auth = req as any;
    const user = await User.findById(auth.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, phone: user.phone, role: (user as any).role || 'user' });
  },
);

// Is this the first user? Helps client decide whether to show admin option during signup
authRouter.get(
  '/first-user',
  asyncHandler(async (_req, res) => {
    const total = await User.countDocuments();
    res.json({ firstUser: total === 0 });
  }),
);

// My memberships (active members linked by my phone)
authRouter.get(
  '/my-members',
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = req as any;
    const me = await User.findById(auth.userId).lean();
    if (!me) return res.status(404).json({ error: 'User not found' });
    const members = await Member.find({ phone: me.phone, active: true }).lean();
    res.json(members);
  }),
);

// Admin: update a user's role
authRouter.post(
  '/role/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = z.object({ role: z.enum(['admin','user']) }).parse(req.body);
    const user = await User.findByIdAndUpdate(req.params.id, { role: body.role }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  }),
);

// Admin: list users (optionally filter approved=false)
authRouter.get(
  '/users',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const list = await User.find().select('-passwordHash');
    res.json(list);
  }),
);

// Admin: approve a user
authRouter.post(
  '/approve/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { approved: true }, { new: true }).select(
      '-passwordHash',
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  }),
);

// Admin: update a user (currently supports phone and approved)
authRouter.put(
  '/users/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid user id' });
    const body = z
      .object({ phone: z.string().min(6).optional(), approved: z.boolean().optional() })
      .refine((v) => Object.keys(v).length > 0, 'No fields to update')
      .parse(req.body);
    const existing = await User.findById(id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    // Disallow changing own approval via this route (not strictly necessary, but safer UX)
    // Role changes remain via dedicated endpoint.
    const updates: any = {};
    let updateMembersPhone = false;
    let oldPhone = existing.phone;
    if (body.phone && body.phone !== existing.phone) {
      const conflict = await User.findOne({ phone: body.phone });
      if (conflict && String(conflict._id) !== String(existing._id)) {
        return res.status(409).json({ error: 'Phone already in use' });
      }
      updates.phone = body.phone;
      updateMembersPhone = true;
    }
    if (typeof body.approved === 'boolean') {
      updates.approved = body.approved;
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No changes' });

    const updated = await User.findByIdAndUpdate(id, updates, { new: true }).select('-passwordHash');
    if (!updated) return res.status(404).json({ error: 'User not found' });

    // If phone changed, update Member docs that reference old phone
    if (updateMembersPhone) {
      await Member.updateMany({ phone: oldPhone }, { $set: { phone: updates.phone } });
    }
    res.json(updated);
  }),
);

// Admin: delete a user (cannot delete self)
authRouter.delete(
  '/users/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const auth = req as any;
    if (String(id) === String(auth.userId)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    // We intentionally do not delete Member docs; they can be reassigned or left as-is.
    res.status(204).end();
  }),
);
