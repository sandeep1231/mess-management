export interface Mess { _id: string; name: string; }
export interface Member { _id: string; messId: string; name: string; phone?: string; active: boolean; }
export interface Meal { _id: string; messId: string; memberId: string; date: string; lunch: boolean; dinner: boolean; }
export interface Expense { _id: string; messId: string; payerMemberId: string; date: string; amount: number; category?: string; note?: string; }

export interface SummaryResult {
  month: string;
  totals: { totalMeals: number; totalExpenses: number; mealRate: number };
  perMember: Array<{ memberId: string; meals: number; cost: number; paid: number; balance: number }>;
}
