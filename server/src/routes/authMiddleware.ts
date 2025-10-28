import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { Member } from '../models/Member';

export interface AuthRequest extends Request {
  userId?: string;
  role?: 'admin' | 'user';
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  const token = header.slice('Bearer '.length);
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  try {
    const payload = jwt.verify(token, secret) as any;
    req.userId = payload.sub as string;
    // Verify the user still exists and is approved; source role from DB to prevent stale role
    User.findById(req.userId)
      .then((user) => {
        if (!user) return res.status(401).json({ error: 'User not found' });
        if (!user.approved) return res.status(403).json({ error: 'Not approved' });
        req.role = (user.role as 'admin' | 'user') || 'user';
        next();
      })
      .catch(() => res.status(401).json({ error: 'Unauthorized' }));
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  next();
}

// Helper: check whether the current user can access a given messId.
// Admins always can; users must have an active Member record with their phone in that mess.
export async function hasMessAccess(req: AuthRequest, messId: string): Promise<boolean> {
  if (req.role === 'admin') return true;
  if (!messId || !Types.ObjectId.isValid(messId)) return false;
  if (!req.userId) return false;
  const user = await User.findById(req.userId).lean();
  if (!user) return false;
  const membership = await Member.findOne({ messId: new Types.ObjectId(messId), phone: (user as any).phone, active: true }).lean();
  return !!membership;
}
