import mongoose, { Schema, Types } from 'mongoose';

export interface MealDoc {
  _id: Types.ObjectId;
  messId: Types.ObjectId;
  memberId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  lunch: boolean;
  dinner: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MealSchema = new Schema<MealDoc>(
  {
    messId: { type: Schema.Types.ObjectId, ref: 'Mess', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    date: { type: String, required: true, index: true },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Meal = mongoose.model<MealDoc>('Meal', MealSchema);
