import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeamProgress extends Document {
  teamId: Types.ObjectId;
  unlockedPhases: number[];
  unlockedLevels: Array<{ phase: number; level: number }>;
  completedLevels: Array<{ phase: number; level: number; completedAt: Date }>;
  totalPenalty: number;
  wrongAttempts: Array<{ phase: number; level: number; count: number }>;
  lastSubmissionTime?: Date;
}

const TeamProgressSchema = new Schema<ITeamProgress>({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  unlockedPhases: [{
    type: Number
  }],
  unlockedLevels: [{
    phase: { type: Number, required: true },
    level: { type: Number, required: true }
  }],
  completedLevels: [{
    phase: { type: Number, required: true },
    level: { type: Number, required: true },
    completedAt: { type: Date, required: true }
  }],
  totalPenalty: {
    type: Number,
    default: 0
  },
  wrongAttempts: [{
    phase: { type: Number, required: true },
    level: { type: Number, required: true },
    count: { type: Number, default: 0 }
  }],
  lastSubmissionTime: {
    type: Date
  }
});

export const TeamProgress = mongoose.model<ITeamProgress>('TeamProgress', TeamProgressSchema);

