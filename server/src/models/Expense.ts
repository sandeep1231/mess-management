import mongoose, { Schema, Types } from 'mongoose';

export interface ExpenseDoc {
  _id: Types.ObjectId;
  messId: Types.ObjectId;
  payerMemberId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  amount: number;
  category?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<ExpenseDoc>(
  {
    messId: { type: Schema.Types.ObjectId, ref: 'Mess', required: true, index: true },
    payerMemberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    date: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String },
    note: { type: String },
  },
  { timestamps: true }
);

export const Expense = mongoose.model<ExpenseDoc>('Expense', ExpenseSchema);
