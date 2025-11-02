import mongoose, { Schema, Document } from 'mongoose';

export interface IPhase extends Document {
  phaseNumber: 1 | 2 | 3;
  name: string;
  description: string;
  unlockCriteria: string;
}

const PhaseSchema = new Schema<IPhase>({
  phaseNumber: {
    type: Number,
    required: true,
    unique: true,
    enum: [1, 2, 3]
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  unlockCriteria: {
    type: String,
    required: true
  }
});

export const Phase = mongoose.model<IPhase>('Phase', PhaseSchema);

