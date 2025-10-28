import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  phone: string; // E.164 or local format; stored as string
  email?: string; // optional legacy
  passwordHash: string;
  approved: boolean;
  role: 'admin' | 'user';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  phone: { type: String, required: true, unique: true, index: true },
  email: { type: String },
  passwordHash: { type: String, required: true },
  approved: { type: Boolean, default: false, index: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user', index: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>('User', UserSchema);
