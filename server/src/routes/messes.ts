import { NextFunction, Request, Response, Router } from 'express';
import { Mess } from '../models/Mess';
import { getMessSummary } from '../services/summaryService';
import { z } from 'zod';
import { hasMessAccess, requireAdmin } from './authMiddleware';

export const router = Router();

router.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bodySchema = z.object({ name: z.string().min(1) });
    const { name } = bodySchema.parse(req.body);
    const doc = await Mess.create({ name });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// List messes by name (typeahead)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = z.object({ q: z.string().optional() }).parse(req.query);
    let docs;
    if (query.q) {
      const rgx = new RegExp(String(query.q), 'i');
      docs = await Mess.find({ name: rgx }).limit(20);
    } else {
      docs = await Mess.find().limit(20);
    }
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const can = await hasMessAccess(req as any, req.params.id);
    if (!can) return res.status(403).json({ error: 'Access denied for this mess' });
    const doc = await Mess.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const can = await hasMessAccess(req as any, req.params.id);
    if (!can) return res.status(403).json({ error: 'Access denied for this mess' });
    const query = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.query);
    const data = await getMessSummary(req.params.id, query.month);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
