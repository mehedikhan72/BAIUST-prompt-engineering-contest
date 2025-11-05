import { TeamProgress } from '../models/TeamProgress.js';
import { PHASE_1_LEVELS, PHASE_2_LEVELS } from '../utils/constants.js';
import { Types } from 'mongoose';

export async function unlockNextLevel(teamId: string | Types.ObjectId, phase: number, currentLevel: number) {
  console.log(`🎮 Unlock function called: Team ${teamId}, Phase ${phase}, Level ${currentLevel}`);
  
  const progress = await TeamProgress.findOne({ teamId });
  
  if (!progress) {
    console.error(`❌ Team progress not found for team ${teamId}`);
    throw new Error('Team progress not found');
  }
  
  console.log(`📊 Current progress:`, {
    unlockedPhases: progress.unlockedPhases,
    unlockedLevels: progress.unlockedLevels,
    completedLevels: progress.completedLevels
  });
  
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
    
    // If completed level 5, unlock Phase 2 (all levels)
    if (currentLevel === 5) {
      const phase2Unlocked = progress.unlockedPhases.includes(2);
      console.log(`🔓 Phase 1 Level 5 completed! Phase 2 already unlocked: ${phase2Unlocked}`);
      
      if (!phase2Unlocked) {
        // Unlock all Phase 2 levels (1-5)
        const phase2Levels = [];
        for (let i = 1; i <= PHASE_2_LEVELS; i++) {
          phase2Levels.push({ phase: 2, level: i });
        }
        
        console.log(`🚀 Unlocking Phase 2 with levels:`, phase2Levels);
        
        await TeamProgress.findOneAndUpdate(
          { teamId },
          {
            $push: {
              unlockedPhases: 2,
              unlockedLevels: { $each: phase2Levels }
            }
          }
        );
        
        console.log(`✅ Phase 2 unlocked successfully for team ${teamId}`);
      }
    }
  } else if (phase === 2) {
    // Phase 2: Unlock Phase 3 when 3/5 levels are completed
    const updatedProgress = await TeamProgress.findOne({ teamId });
    const phase2CompletedCount = updatedProgress?.completedLevels.filter(cl => cl.phase === 2).length || 0;
    
    console.log(`📊 Phase 2 progress: ${phase2CompletedCount}/5 levels completed`);
    
    if (phase2CompletedCount >= 3 && !updatedProgress?.unlockedPhases.includes(3)) {
      console.log(`🎉 Phase 3 unlocked! Team ${teamId} completed ${phase2CompletedCount}/5 Phase 2 levels`);
      
      await TeamProgress.findOneAndUpdate(
        { teamId },
        {
          $push: {
            unlockedPhases: 3,
            unlockedLevels: { phase: 3, level: 1 }
          }
        }
      );
      
      console.log(`✅ Phase 3 unlocked successfully for team ${teamId}`);
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
  
  // Phase 2: All levels are accessible if phase is unlocked
  if (phase === 2) {
    return level >= 1 && level <= PHASE_2_LEVELS;
  }
  
  // For other phases: Check if specific level is unlocked
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

