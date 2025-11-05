import { connectDB } from '../db.js';
import { TeamProgress } from '../models/TeamProgress.js';

async function unlockPhase1Levels() {
  try {
    await connectDB();
    console.log('🔓 Unlocking Phase 1 levels 3, 4, and 5 for all teams...');

    // Find all team progress records
    const teamProgresses = await TeamProgress.find({});
    console.log(`📊 Found ${teamProgresses.length} teams to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const progress of teamProgresses) {
      // Check what Phase 1 levels are already unlocked
      const phase1Unlocked = progress.unlockedLevels.filter(ul => ul.phase === 1);
      const unlockedLevelNumbers = phase1Unlocked.map(ul => ul.level);
      
      console.log(`Team ${progress.teamId}: Currently has Phase 1 levels [${unlockedLevelNumbers.join(', ')}] unlocked`);

      // Determine which levels need to be added
      const levelsToAdd = [];
      for (let level = 3; level <= 5; level++) {
        if (!unlockedLevelNumbers.includes(level)) {
          levelsToAdd.push({ phase: 1, level });
        }
      }

      if (levelsToAdd.length === 0) {
        console.log(`  ⚠️  Already has all Phase 1 levels unlocked, skipping`);
        skippedCount++;
        continue;
      }

      console.log(`  ➕ Adding Phase 1 levels: [${levelsToAdd.map(l => l.level).join(', ')}]`);

      // Update the team progress
      await TeamProgress.findByIdAndUpdate(
        progress._id,
        {
          $push: {
            unlockedLevels: { $each: levelsToAdd }
          }
        }
      );

      console.log(`  ✅ Updated successfully`);
      updatedCount++;
    }

    // Summary
    console.log('\n📊 Unlock Summary:');
    console.log(`✅ Teams updated: ${updatedCount}`);
    console.log(`⚠️  Teams skipped (already unlocked): ${skippedCount}`);
    console.log(`📝 Total teams processed: ${teamProgresses.length}`);

    if (updatedCount > 0) {
      console.log('\n🎉 Phase 1 levels 3, 4, and 5 unlocked for all teams!');
    }

  } catch (error) {
    console.error('💥 Error unlocking Phase 1 levels:', error);
  } finally {
    process.exit(0);
  }
}

// Run the unlock function
unlockPhase1Levels();

export { unlockPhase1Levels };
