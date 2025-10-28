import { Router } from 'express';
import { router as memberRouter } from './members';
import { router as mealRouter } from './meals';
import { router as expenseRouter } from './expenses';
import { router as messRouter } from './messes';

export const router = Router();

router.use('/members', memberRouter);
router.use('/meals', mealRouter);
router.use('/expenses', expenseRouter);
router.use('/messes', messRouter);
