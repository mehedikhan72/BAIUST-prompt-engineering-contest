import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { User } from '../models/User';
import { TeamProgress } from '../models/TeamProgress';

interface TeamData {
  "Team Name": string;
  "Participant 1": string;
  "Participant 2": string;
  "Email": string;
  "Password": string;
}

async function seedTeamsFromJson() {
  try {
    // Try multiple MongoDB connection strings
    const connectionStrings = [
      process.env.MONGODB_URI,
      'mongodb://admin:password@mongo:27017/contest?authSource=admin',
      'mongodb://mongo:27017/contest',
      'mongodb://admin:password@mongo:27017/contest?authSource=admin',
      'mongodb://localhost:27017/contest',
      'mongodb://127.0.0.1:27017/contest'
    ].filter(Boolean);

    let connected = false;
    let MONGODB_URI = '';

    for (const uri of connectionStrings) {
      try {
        console.log(`🔌 Attempting to connect to: ${uri}`);
        await mongoose.connect(uri as string);
        MONGODB_URI = uri as string;
        connected = true;
        console.log('✅ Connected to MongoDB');
        break;
      } catch (error) {
        console.log(`❌ Failed to connect to: ${uri}`);
      }
    }

    if (!connected) {
      throw new Error('Could not connect to any MongoDB instance. Please ensure MongoDB is running.');
    }

    // Read teams.json file
    const teamsPath = path.join(__dirname, '../../data/teams.json');
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
    console.log('\n📊 Seeding Summary:');
    console.log(`✅ Teams created: ${createdCount}`);
    console.log(`⚠️  Teams skipped (already exist): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total teams in JSON: ${teamsData.length}`);

    if (createdCount > 0) {
      console.log('\n🎉 Team seeding completed successfully!');
    }

  } catch (error) {
    console.error('💥 Fatal error during seeding:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seeding function
seedTeamsFromJson();

export { seedTeamsFromJson };