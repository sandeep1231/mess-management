import { NextFunction, Request, Response, Router } from 'express';
import { Types } from 'mongoose';
import { Meal } from '../models/Meal';
import { z } from 'zod';
import { hasMessAccess, requireAdmin } from './authMiddleware';
import { Member } from '../models/Member';
import { User } from '../models/User';
import type { AuthRequest } from './authMiddleware';

export const router = Router();

router.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z
      .object({ messId: z.string(), memberId: z.string(), date: z.string(), lunch: z.boolean().optional(), dinner: z.boolean().optional() })
      .parse(req.body);
    const doc = await Meal.create({ ...body, lunch: !!body.lunch, dinner: !!body.dinner });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = z
      .object({ messId: z.string(), month: z.string().regex(/^\d{4}-\d{2}$/).optional(), memberId: z.string().optional() })
      .parse(req.query);
    if (!Types.ObjectId.isValid(q.messId)) return res.status(400).json({ error: 'Invalid messId' });
  const filter: any = { messId: new Types.ObjectId(q.messId) };
  const can = await hasMessAccess(req as any, q.messId);
  if (!can) return res.status(403).json({ error: 'Access denied for this mess' });
    if (q.month) {
      const [yy, mm] = q.month.split('-');
      const nextMonthNum = Number(mm) === 12 ? 1 : Number(mm) + 1;
      const nextYearNum = Number(mm) === 12 ? Number(yy) + 1 : Number(yy);
      const nextMonth = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}`;
      filter.date = { $gte: `${q.month}-01`, $lt: `${nextMonth}-01` };
    }
    if (q.memberId) {
      if (!Types.ObjectId.isValid(q.memberId)) return res.status(400).json({ error: 'Invalid memberId' });
      filter.memberId = new Types.ObjectId(q.memberId);
    }
  const docs = await Meal.find(filter);
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// Bulk upsert attendance for a given date
// Admins can update any member in the mess; regular users can only update their own attendance (matched by phone)
router.post('/attendance', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      messId: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      items: z
        .array(
          z.object({
            memberId: z.string(),
            lunch: z.boolean().optional(),
            dinner: z.boolean().optional(),
          }),
        )
        .min(1),
    });
    const body = schema.parse(req.body);
    const messId = body.messId;
    if (!Types.ObjectId.isValid(messId)) return res.status(400).json({ error: 'Invalid messId' });
    const date = body.date || new Date().toISOString().slice(0, 10);
    // Validate memberIds and ensure they belong to the mess
    const memberIds = body.items.map((i) => i.memberId);
    for (const id of memberIds) if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: `Invalid memberId: ${id}` });
  const members = await Member.find({ _id: { $in: memberIds }, messId: new Types.ObjectId(messId), active: true }).lean();
  if (members.length !== memberIds.length) return res.status(400).json({ error: 'Some memberIds are not in this mess' });

  let allowedMemberIds = new Set<string>(memberIds);
  if (req.role !== 'admin') {
      // Limit to only the member matching the logged-in user's phone in this mess
      if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(req.userId).lean();
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const my = await Member.findOne({ messId: new Types.ObjectId(messId), phone: user.phone, active: true }).lean();
      if (!my) return res.status(403).json({ error: 'You can only update your own attendance' });
      allowedMemberIds = new Set<string>([String((my as any)._id)]);
      // If user attempted to modify others, reject
      const notAllowed = memberIds.filter((id) => !allowedMemberIds.has(id));
      if (notAllowed.length > 0) {
        return res.status(403).json({ error: 'You can only update your own attendance' });
      }
    }

    const ops = body.items
      .filter((i) => allowedMemberIds.has(i.memberId))
      .map((i) =>
        Meal.findOneAndUpdate(
          { messId: new Types.ObjectId(messId), memberId: new Types.ObjectId(i.memberId), date },
          { $set: { lunch: !!i.lunch, dinner: !!i.dinner } },
          { upsert: true, new: true },
        ),
      );
    const updated = await Promise.all(ops);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Self add: regular users can add their own meal record for a date in a mess they belong to
router.post('/self', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      messId: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      lunch: z.boolean().optional(),
      dinner: z.boolean().optional(),
    });
    const body = schema.parse(req.body);
    const { messId, date } = body;
    if (!Types.ObjectId.isValid(messId)) return res.status(400).json({ error: 'Invalid messId' });
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const can = await hasMessAccess(req as any, messId);
    if (!can) return res.status(403).json({ error: 'Access denied for this mess' });
    if (!body.lunch && !body.dinner) return res.status(400).json({ error: 'Select lunch and/or dinner' });

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const me = await Member.findOne({ messId: new Types.ObjectId(messId), phone: (user as any).phone, active: true }).lean();
    if (!me) return res.status(403).json({ error: 'No membership found in this mess' });

    const doc = await Meal.findOneAndUpdate(
      { messId: new Types.ObjectId(messId), memberId: (me as any)._id, date },
      { $set: { lunch: !!body.lunch, dinner: !!body.dinner } },
      { upsert: true, new: true },
    );
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Meal.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patch = z
      .object({
        date: z.string().optional(),
        lunch: z.boolean().optional(),
        dinner: z.boolean().optional(),
      })
      .refine((v) => Object.keys(v).length > 0, 'No fields to update')
      .parse(req.body);
    const updated = await Meal.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
