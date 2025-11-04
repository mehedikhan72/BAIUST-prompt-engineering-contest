import { connectDB } from '../utils/db.js';
import { TeamProgress } from '../models/TeamProgress.js';
import { PHASE_2_LEVELS } from '../utils/constants.js';

async function fixPhase2Unlock() {
  await connectDB();
  
  console.log('🔧 Fixing Phase 2 unlock for teams that completed Phase 1 Level 3...');
  
  // Find teams that completed Phase 1 Level 3 but don't have Phase 2 unlocked
  const teamsNeedingFix = await TeamProgress.find({
    'completedLevels': {
      $elemMatch: { phase: 1, level: 3 }
    },
    'unlockedPhases': { $nin: [2] }
  });
  
  console.log(`Found ${teamsNeedingFix.length} teams needing Phase 2 unlock fix`);
  
  for (const team of teamsNeedingFix) {
    console.log(`Fixing team: ${team.teamId}`);
    
    // Unlock all Phase 2 levels
    const phase2Levels = [];
    for (let i = 1; i <= PHASE_2_LEVELS; i++) {
      phase2Levels.push({ phase: 2, level: i });
    }
    
    await TeamProgress.findOneAndUpdate(
      { _id: team._id },
      {
        $push: {
          unlockedPhases: 2,
          unlockedLevels: { $each: phase2Levels }
        }
      }
    );
    
    console.log(`✅ Fixed team ${team.teamId} - Phase 2 unlocked`);
  }
  
  console.log('🎉 All teams fixed!');
  process.exit(0);
}

fixPhase2Unlock().catch(console.error);
