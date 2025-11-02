import { Contest } from '../models/Contest.js';
import { TeamProgress } from '../models/TeamProgress.js';
import { WRONG_GUESS_PENALTY } from '../utils/constants.js';

export async function calculateTimePenalty(): Promise<number> {
  const contest = await Contest.findOne({ isActive: true });
  
  if (!contest) {
    throw new Error('No active contest found');
  }
  
  const now = new Date();
  const contestStart = contest.startTime;
  const minutesElapsed = Math.floor((now.getTime() - contestStart.getTime()) / 60000);
  
  return minutesElapsed;
}

export async function addCorrectGuessPenalty(teamId: string) {
  const penalty = await calculateTimePenalty();
  
  await TeamProgress.findOneAndUpdate(
    { teamId },
    { 
      $inc: { totalPenalty: penalty },
      $set: { lastSubmissionTime: new Date() }
    }
  );
  
  return penalty;
}

export async function addWrongGuessPenalty(teamId: string, phase: number, level: number) {
  const existingAttempt = await TeamProgress.findOne({
    teamId,
    'wrongAttempts.phase': phase,
    'wrongAttempts.level': level
  });
  
  if (existingAttempt) {
    await TeamProgress.findOneAndUpdate(
      { teamId, 'wrongAttempts.phase': phase, 'wrongAttempts.level': level },
      { 
        $inc: { 
          totalPenalty: WRONG_GUESS_PENALTY,
          'wrongAttempts.$.count': 1
        }
      }
    );
  } else {
    await TeamProgress.findOneAndUpdate(
      { teamId },
      { 
        $inc: { totalPenalty: WRONG_GUESS_PENALTY },
        $push: { wrongAttempts: { phase, level, count: 1 } }
      }
    );
  }
}

export async function applyJudgeBonus(teamId: string, score: number, maxScore: number = 10) {
  // Calculate bonus based on score (higher score = bigger penalty reduction)
  const timePenalty = await calculateTimePenalty();
  const bonus = Math.floor((score / maxScore) * timePenalty);
  
  await TeamProgress.findOneAndUpdate(
    { teamId },
    { 
      $inc: { totalPenalty: -bonus }, // Subtract from penalty
      $set: { lastSubmissionTime: new Date() }
    }
  );
  
  return bonus;
}

