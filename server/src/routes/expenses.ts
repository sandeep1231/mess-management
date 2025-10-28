import { NextFunction, Request, Response, Router } from 'express';
import { Types } from 'mongoose';
import { Expense } from '../models/Expense';
import { z } from 'zod';
import { hasMessAccess, requireAdmin } from './authMiddleware';
import { Member } from '../models/Member';
import { User } from '../models/User';

export const router = Router();

router.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z
      .object({
        messId: z.string(),
        payerMemberId: z.string(),
        date: z.string(),
        amount: z.number().positive(),
        category: z.string().optional(),
        note: z.string().optional(),
      })
      .parse(req.body);
    const doc = await Expense.create(body);
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
      filter.payerMemberId = new Types.ObjectId(q.memberId);
    }
    const docs = await Expense.find(filter);
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
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
        amount: z.number().positive().optional(),
        category: z.string().optional(),
        note: z.string().optional(),
        payerMemberId: z.string().optional(),
      })
      .refine((v) => Object.keys(v).length > 0, 'No fields to update')
      .parse(req.body);
    const updated = await Expense.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Self add: regular users can add their own expense as payer in a mess they belong to
router.post('/self', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z
      .object({
        messId: z.string(),
        date: z.string(),
        amount: z.number().positive(),
        category: z.string().optional(),
        note: z.string().optional(),
      })
      .parse(req.body);
    if (!Types.ObjectId.isValid(body.messId)) return res.status(400).json({ error: 'Invalid messId' });
    const can = await hasMessAccess(req as any, body.messId);
    if (!can) return res.status(403).json({ error: 'Access denied for this mess' });
    const auth = req as any;
    if (!auth.userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(auth.userId).lean();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const me = await Member.findOne({ messId: new Types.ObjectId(body.messId), phone: (user as any).phone, active: true }).lean();
    if (!me) return res.status(403).json({ error: 'No membership found in this mess' });
    const doc = await Expense.create({
      messId: new Types.ObjectId(body.messId),
      payerMemberId: (me as any)._id,
      date: body.date,
      amount: body.amount,
      category: body.category,
      note: body.note,
    } as any);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});
