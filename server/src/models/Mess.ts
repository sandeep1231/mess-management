import mongoose, { Schema, Types } from 'mongoose';

export interface MessDoc {
  _id: Types.ObjectId;
  name: string;
  ownerId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MessSchema = new Schema<MessDoc>(
  {
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

MessSchema.index({ name: 1 });

export const Mess = mongoose.model<MessDoc>('Mess', MessSchema);
