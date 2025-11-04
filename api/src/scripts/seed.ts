import bcrypt from 'bcryptjs';
import { connectDB } from '../db.js';
import { User } from '../models/User.js';
import { Contest } from '../models/Contest.js';
import { Phase } from '../models/Phase.js';
import { Level } from '../models/Level.js';

async function seed() {
  await connectDB();

  console.log('🌱 Seeding database...');

  // Create judge account
  const judgePassword = await bcrypt.hash('judge123', 10);
  await User.findOneAndUpdate(
    { email: 'judge@contest.com' },
    {
      email: 'judge@contest.com',
      password: judgePassword,
      role: 'JUDGE',
      createdAt: new Date()
    },
    { upsert: true }
  );
  console.log('✅ Judge account created: judge@contest.com / judge123');

  // Create sample team
  const teamPassword = await bcrypt.hash('team123', 10);
  await User.findOneAndUpdate(
    { email: 'team123@contest.com' },
    {
      email: 'team123@contest.com',
      password: teamPassword,
      role: 'TEAM',
      teamName: 'Team Beta',
      participants: [
        { name: 'Charlie Brown', email: 'charlie@example.com' },
        { name: 'Diana Prince', email: 'diana@example.com' }
      ],
      createdAt: new Date()
    },
    { upsert: true }
  );
  console.log('✅ Sample team created: team1@contest.com / team123');

  // Create contest
  const contestStart = new Date();
  const contestEnd = new Date(contestStart.getTime() + 4 * 60 * 60 * 1000); // 4 hours
  await Contest.findOneAndUpdate(
    {},
    {
      startTime: contestStart,
      endTime: contestEnd,
      isActive: true
    },
    { upsert: true }
  );
  console.log('✅ Contest created');

  // Create phases
  const phases = [
    {
      phaseNumber: 1,
      name: 'Password Retrieval',
      description: 'Interact with the RAG agent to retrieve passwords',
      unlockCriteria: 'Available from start'
    },
    {
      phaseNumber: 2,
      name: 'Reverse Prompt Engineering',
      description: 'Craft prompts to recreate reference images',
      unlockCriteria: 'Complete Phase 1 Level 3 (All levels unlocked)'
    },
    {
      phaseNumber: 3,
      name: 'Build-Your-Own RAG',
      description: 'Build a functional RAG system',
      unlockCriteria: 'Complete Phase 2 Level 3'
    }
  ];

  for (const phase of phases) {
    await Phase.findOneAndUpdate(
      { phaseNumber: phase.phaseNumber },
      phase,
      { upsert: true }
    );
  }
  console.log('✅ Phases created');

  // Create levels
  const levels = [];

  // Phase 1 levels
  for (let i = 1; i <= 5; i++) {
    levels.push({
      phaseNumber: 1,
      levelNumber: i,
      name: `Password Level ${i}`,
      description: `Retrieve the password for level ${i} from the AI agent`,
      maxScore: 10
    });
  }

  // Phase 2 levels
  for (let i = 1; i <= 5; i++) {
    levels.push({
      phaseNumber: 2,
      levelNumber: i,
      name: `Image Generation Level ${i}`,
      description: `Recreate the reference image using prompt engineering`,
      referenceImage: '',
      assets: ['placeholder asset 1', 'placeholder asset 2'],
      maxScore: 10
    });
  }

  // Phase 3 level
  levels.push({
    phaseNumber: 3,
    levelNumber: 1,
    name: 'RAG System Implementation',
    description: 'Build and submit your own RAG system',
    maxScore: 10
  });

  for (const level of levels) {
    await Level.findOneAndUpdate(
      { phaseNumber: level.phaseNumber, levelNumber: level.levelNumber },
      level,
      { upsert: true }
    );
  }
  console.log('✅ Levels created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Login credentials:');
  console.log('Judge: judge@contest.com / judge123');
  console.log('Team: team1@contest.com / team123');

  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});

