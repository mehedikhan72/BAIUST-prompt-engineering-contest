import mongoose, { Schema, Document } from 'mongoose';

export interface ILevel extends Document {
  phaseNumber: number;
  levelNumber: number;
  name: string;
  description: string;
  // NOTE: No secret/password stored for Phase 1 - ai-agent-service handles that internally
  referenceImage?: string; // Phase 2 bunny URL
  assets?: string[]; // Phase 2 asset list
  maxScore?: number; // Phase 2/3 max judge score (default 10)
}

const LevelSchema = new Schema<ILevel>({
  phaseNumber: {
    type: Number,
    required: true
  },
  levelNumber: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  referenceImage: {
    type: String
  },
  assets: [{
    type: String
  }],
  maxScore: {
    type: Number,
    default: 10
  }
});

// Compound unique index for phase + level
LevelSchema.index({ phaseNumber: 1, levelNumber: 1 }, { unique: true });

export const Level = mongoose.model<ILevel>('Level', LevelSchema);

