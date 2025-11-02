import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'JUDGE' | 'TEAM';
  teamName?: string;
  participants?: Array<{ name: string; email: string }>;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['JUDGE', 'TEAM'],
    required: true
  },
  teamName: {
    type: String,
    required: function(this: IUser) { return this.role === 'TEAM'; }
  },
  participants: [{
    name: { type: String, required: true },
    email: { type: String, required: true }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const User = mongoose.model<IUser>('User', UserSchema);

