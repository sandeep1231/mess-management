import { NextFunction, Request, Response, Router } from 'express';
import { Member } from '../models/Member';
import { z } from 'zod';
import { hasMessAccess, requireAdmin } from './authMiddleware';

export const router = Router();

router.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z
      .object({ messId: z.string(), name: z.string().min(1), phone: z.string().optional(), active: z.boolean().optional() })
      .parse(req.body);
    const doc = await Member.create(body);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = z.object({ messId: z.string() }).parse(req.query);
    // Enforce access: non-admins must belong to this mess
    // cast req to AuthRequest to access role/userId
    const can = await hasMessAccess(req as any, q.messId);
    if (!can) return res.status(403).json({ error: 'Access denied for this mess' });
    const docs = await Member.find({ messId: q.messId });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({ name: z.string().optional(), phone: z.string().optional(), active: z.boolean().optional() }).parse(req.body);
    const doc = await Member.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// Search members by messId and query string against name or phone
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = z.object({ messId: z.string(), q: z.string().min(1) }).parse(req.query);
    const can = await hasMessAccess(req as any, q.messId);
    if (!can) return res.status(403).json({ error: 'Access denied for this mess' });
    const rgx = new RegExp(q.q, 'i');
    const docs = await Member.find({ messId: q.messId, $or: [{ name: rgx }, { phone: rgx }] }).limit(20);
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
