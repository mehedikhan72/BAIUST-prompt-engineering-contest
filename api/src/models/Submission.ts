import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubmission extends Document {
  teamId: Types.ObjectId;
  phaseNumber: number;
  levelNumber: number;
  type: 'PHASE1_PASSWORD' | 'PHASE2_IMAGE' | 'PHASE3_RAG';
  content: string; // password or prompt
  generatedImageUrl?: string; // Phase 2 bunny URL
  files?: string[]; // Phase 3 bunny URLs
  status: 'PENDING' | 'JUDGED' | 'REJECTED';
  judgeScore?: number;
  judgedBy?: Types.ObjectId;
  judgedAt?: Date;
  canResubmit: boolean;
  submittedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phaseNumber: {
    type: Number,
    required: true
  },
  levelNumber: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['PHASE1_PASSWORD', 'PHASE2_IMAGE', 'PHASE3_RAG'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  generatedImageUrl: {
    type: String
  },
  files: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['PENDING', 'JUDGED', 'REJECTED'],
    default: 'PENDING'
  },
  judgeScore: {
    type: Number
  },
  judgedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  judgedAt: {
    type: Date
  },
  canResubmit: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);

