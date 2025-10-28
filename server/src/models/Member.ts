import mongoose, { Schema, Types } from 'mongoose';

export interface MemberDoc {
  _id: Types.ObjectId;
  messId: Types.ObjectId;
  name: string;
  phone?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<MemberDoc>(
  {
    messId: { type: Schema.Types.ObjectId, ref: 'Mess', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Member = mongoose.model<MemberDoc>('Member', MemberSchema);
