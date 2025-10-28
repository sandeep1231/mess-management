import { Types } from 'mongoose';
import { Expense, type ExpenseDoc } from '../models/Expense';
import { Meal, type MealDoc } from '../models/Meal';

export interface SummaryResult {
  month: string; // YYYY-MM
  totals: {
    totalMeals: number;
    totalExpenses: number;
    mealRate: number; // per meal cost
  };
  perMember: Array<{
    memberId: string;
    meals: number;
    cost: number;
    paid: number; // sum of expenses paid by the member
    balance: number; // paid - cost (positive = should receive)
  }>;
}

export async function getMessSummary(messId: string, month: string): Promise<SummaryResult> {
  const [expenses, meals] = await Promise.all([
    Expense.find({ messId: new Types.ObjectId(messId), date: new RegExp(`^${month}`) }),
    Meal.find({ messId: new Types.ObjectId(messId), date: new RegExp(`^${month}`) }),
  ]);

  const totalExpenses = expenses.reduce((sum: number, e: ExpenseDoc) => sum + e.amount, 0);
  const totalMeals = meals.reduce((sum: number, m: MealDoc) => sum + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0);
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;

  const mealsByMember: Record<string, number> = {};
  const paidByMember: Record<string, number> = {};

  for (const m of meals) {
    const id = m.memberId.toString();
    const count = (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0);
    mealsByMember[id] = (mealsByMember[id] || 0) + count;
  }
  for (const e of expenses) {
    const id = e.payerMemberId.toString();
    paidByMember[id] = (paidByMember[id] || 0) + e.amount;
  }

  const memberIds = Array.from(new Set([...Object.keys(mealsByMember), ...Object.keys(paidByMember)]));
  const perMember = memberIds.map((id) => {
    const meals = mealsByMember[id] || 0;
    const paid = paidByMember[id] || 0;
    const cost = meals * mealRate;
    const balance = paid - cost;
    return { memberId: id, meals, cost, paid, balance };
  });

  return {
    month,
    totals: { totalMeals, totalExpenses, mealRate },
    perMember,
  };
}
