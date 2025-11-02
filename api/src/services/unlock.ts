import { TeamProgress } from '../models/TeamProgress.js';
import { PHASE_1_LEVELS } from '../utils/constants.js';
import { Types } from 'mongoose';

export async function unlockNextLevel(teamId: string | Types.ObjectId, phase: number, currentLevel: number) {
  const progress = await TeamProgress.findOne({ teamId });
  
  if (!progress) {
    throw new Error('Team progress not found');
  }
  
  // Mark current level as completed
  const alreadyCompleted = progress.completedLevels.some(
    cl => cl.phase === phase && cl.level === currentLevel
  );
  
  if (!alreadyCompleted) {
    await TeamProgress.findOneAndUpdate(
      { teamId },
      {
        $push: {
          completedLevels: {
            phase,
            level: currentLevel,
            completedAt: new Date()
          }
        }
      }
    );
  }
  
  // Determine what to unlock next
  if (phase === 1) {
    // Phase 1 logic
    if (currentLevel < PHASE_1_LEVELS) {
      // Unlock next level in Phase 1
      const nextLevel = currentLevel + 1;
      const alreadyUnlocked = progress.unlockedLevels.some(
        ul => ul.phase === 1 && ul.level === nextLevel
      );
      
      if (!alreadyUnlocked) {
        await TeamProgress.findOneAndUpdate(
          { teamId },
          {
            $push: {
              unlockedLevels: { phase: 1, level: nextLevel }
            }
          }
        );
      }
    }
    
    // If completed level 3, unlock Phase 2
    if (currentLevel === 3) {
      const phase2Unlocked = progress.unlockedPhases.includes(2);
      
      if (!phase2Unlocked) {
        await TeamProgress.findOneAndUpdate(
          { teamId },
          {
            $push: {
              unlockedPhases: 2,
              unlockedLevels: { phase: 2, level: 1 }
            }
          }
        );
      }
    }
  } else if (phase === 2) {
    // Phase 2: Unlock Phase 3 when completed
    const phase2Completed = progress.completedLevels.filter(cl => cl.phase === 2).length;
    
    if (phase2Completed >= 5 && !progress.unlockedPhases.includes(3)) {
      await TeamProgress.findOneAndUpdate(
        { teamId },
        {
          $push: {
            unlockedPhases: 3,
            unlockedLevels: { phase: 3, level: 1 }
          }
        }
      );
    }
  }
}

export async function checkLevelAccess(teamId: string | Types.ObjectId, phase: number, level: number): Promise<boolean> {
  const progress = await TeamProgress.findOne({ teamId });
  
  if (!progress) {
    return false;
  }
  
  // Check if phase is unlocked
  if (!progress.unlockedPhases.includes(phase)) {
    return false;
  }
  
  // Check if level is unlocked
  const levelUnlocked = progress.unlockedLevels.some(
    ul => ul.phase === phase && ul.level === level
  );
  
  return levelUnlocked;
}

export async function checkLevelCompleted(teamId: string | Types.ObjectId, phase: number, level: number): Promise<boolean> {
  const progress = await TeamProgress.findOne({ teamId });
  
  if (!progress) {
    return false;
  }
  
  const levelCompleted = progress.completedLevels.some(
    cl => cl.phase === phase && cl.level === level
  );
  
  return levelCompleted;
}

export async function initializeTeamProgress(teamId: string | Types.ObjectId) {
  const existing = await TeamProgress.findOne({ teamId });
  
  if (existing) {
    return existing;
  }
  
  // Initialize with Phase 1, Level 1 unlocked
  return await TeamProgress.create({
    teamId,
    unlockedPhases: [1],
    unlockedLevels: [{ phase: 1, level: 1 }],
    completedLevels: [],
    totalPenalty: 0,
    wrongAttempts: []
  });
}

