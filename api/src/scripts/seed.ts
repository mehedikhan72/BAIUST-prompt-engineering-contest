import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { connectDB } from '../db.js';
import { User } from '../models/User.js';
import { Contest } from '../models/Contest.js';
import { Phase } from '../models/Phase.js';
import { Level } from '../models/Level.js';
import { TeamProgress } from '../models/TeamProgress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TeamData {
  "Team Name": string;
  "Participant 1": string;
  "Participant 2": string;
  "Email": string;
  "Password": string;
}

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
  const phase2Levels = [
    {
      phaseNumber: 2,
      levelNumber: 1,
      name: 'Nature Scene Recreation',
      description: 'Create a stunning nature scene that matches the reference image. Pay attention to lighting, composition, and natural elements.',
      referenceImage: 'https://via.placeholder.com/800x600/4CAF50/FFFFFF?text=Nature+Reference+1',
      assets: ['mountain', 'lake', 'forest', 'sunset lighting'],
      maxScore: 10
    },
    {
      phaseNumber: 2,
      levelNumber: 2,
      name: 'Urban Architecture Challenge',
      description: 'Design an urban cityscape with modern architecture. Focus on building styles, street layouts, and urban atmosphere.',
      referenceImage: 'https://via.placeholder.com/800x600/2196F3/FFFFFF?text=Urban+Reference+2',
      assets: ['skyscrapers', 'street lights', 'glass buildings', 'modern design'],
      maxScore: 10
    },
    {
      phaseNumber: 2,
      levelNumber: 3,
      name: 'Portrait Photography Style',
      description: 'Create a professional portrait that captures the mood and style of the reference image. Consider lighting, expression, and background.',
      referenceImage: 'https://via.placeholder.com/800x600/FF9800/FFFFFF?text=Portrait+Reference+3',
      assets: ['professional lighting', 'neutral background', 'natural expression', 'shallow depth of field'],
      maxScore: 10
    },
    {
      phaseNumber: 2,
      levelNumber: 4,
      name: 'Fantasy World Creation',
      description: 'Build a magical fantasy world with mystical elements. Incorporate fantasy creatures, magical effects, and otherworldly landscapes.',
      referenceImage: 'https://via.placeholder.com/800x600/9C27B0/FFFFFF?text=Fantasy+Reference+4',
      assets: ['dragon', 'castle', 'magical crystals', 'glowing effects', 'mystical forest'],
      maxScore: 10
    },
    {
      phaseNumber: 2,
      levelNumber: 5,
      name: 'Futuristic Sci-Fi Scene',
      description: 'Design a cutting-edge futuristic scene with advanced technology. Include robots, space elements, and sci-fi aesthetics.',
      referenceImage: 'https://via.placeholder.com/800x600/607D8B/FFFFFF?text=Sci-Fi+Reference+5',
      assets: ['robots', 'holographic displays', 'neon lights', 'space station', 'advanced technology'],
      maxScore: 10
    }
  ];

  for (const level of phase2Levels) {
    levels.push(level);
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

  // Seed teams from teams.json
  await seedTeamsFromJson();

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Login credentials:');
  console.log('Judge: judge@contest.com / judge123');
  console.log('Sample Team: team123@contest.com / team123');

  process.exit(0);
}

async function seedTeamsFromJson() {
  try {
    console.log('\n🏢 Seeding teams from teams.json...');
    
    // Read teams.json file
    const teamsPath = path.join(__dirname, '../../data/teams.json');
    
    if (!fs.existsSync(teamsPath)) {
      console.log('⚠️  teams.json file not found, skipping team seeding');
      return;
    }

    const teamsData: TeamData[] = JSON.parse(fs.readFileSync(teamsPath, 'utf8'));
    console.log(`📂 Found ${teamsData.length} teams in teams.json`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const teamData of teamsData) {
      try {
        const email = teamData.Email.toLowerCase().trim();
        
        // Check if team already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          console.log(`⚠️  Team "${teamData['Team Name']}" already exists (${email})`);
          skippedCount++;
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(teamData.Password, 10);

        // Create team user
        const teamUser = new User({
          email: email,
          password: hashedPassword,
          role: 'TEAM',
          teamName: teamData['Team Name'],
          participants: [
            { name: teamData['Participant 1'], email: email },
            { name: teamData['Participant 2'], email: email }
          ]
        });

        const savedUser = await teamUser.save();

        // Create initial team progress (unlocked Phase 1, Level 1)
        const teamProgress = new TeamProgress({
          teamId: savedUser._id,
          unlockedPhases: [1],
          unlockedLevels: [
            { phase: 1, level: 1 }
          ],
          completedLevels: [],
          totalPenalty: 0,
          wrongAttempts: []
        });

        await teamProgress.save();

        console.log(`✅ Created team: "${teamData['Team Name']}" (${email})`);
        createdCount++;

      } catch (error: any) {
        console.error(`❌ Error creating team "${teamData['Team Name']}":`, error.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Team Seeding Summary:');
    console.log(`✅ Teams created: ${createdCount}`);
    console.log(`⚠️  Teams skipped (already exist): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total teams in JSON: ${teamsData.length}`);

    if (createdCount > 0) {
      console.log('🎉 Teams seeded successfully!');
    }

  } catch (error: any) {
    console.error('💥 Error seeding teams:', error.message);
  }
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});

