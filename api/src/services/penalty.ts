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
  // Calculate a small fixed bonus based on score quality (max 10 minutes reduction)
  // This prevents massive bonuses that can make penalties negative
  const scorePercentage = score / maxScore;
  const maxBonus = 10; // Maximum 10 minutes bonus
  const bonus = Math.floor(scorePercentage * maxBonus);
  
  // Get current penalty to ensure it doesn't go negative
  const progress = await TeamProgress.findOne({ teamId });
  if (!progress) {
    throw new Error('Team progress not found');
  }
  
  const currentPenalty = progress.totalPenalty || 0;
  const actualBonus = Math.min(bonus, currentPenalty); // Don't reduce below 0
  const newPenalty = currentPenalty - actualBonus;
  
  await TeamProgress.findOneAndUpdate(
    { teamId },
    { 
      $set: { 
        totalPenalty: newPenalty, // Always >= 0
        lastSubmissionTime: new Date() 
      }
    }
  );
  
  console.log(`🎯 Judge bonus applied: Team penalty ${currentPenalty} → ${newPenalty} (bonus: ${actualBonus} minutes for score ${score}/${maxScore})`);
  
  return actualBonus;
}

