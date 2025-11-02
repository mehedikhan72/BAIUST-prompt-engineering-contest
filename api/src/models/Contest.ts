import mongoose, { Schema, Document } from 'mongoose';

export interface IContest extends Document {
  startTime: Date;
  endTime: Date;
  isActive: boolean;
}

const ContestSchema = new Schema<IContest>({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  }
});

export const Contest = mongoose.model<IContest>('Contest', ContestSchema);

