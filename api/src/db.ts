import mongoose from 'mongoose';

export async function connectDB() {
  // Try multiple MongoDB connection strings for different environments
  const connectionStrings = [
    process.env.MONGODB_URI,
    'mongodb://admin:password@localhost:27017/contest?authSource=admin',
    'mongodb://localhost:27017/contest',
    'mongodb://admin:password@mongo:27017/contest?authSource=admin',
    'mongodb://mongo:27017/contest',
    'mongodb://127.0.0.1:27017/contest'
  ].filter(Boolean);

  let connected = false;
  let lastError: any = null;

  for (const uri of connectionStrings) {
    try {
      console.log(`🔌 Attempting to connect to MongoDB: ${uri}`);
      await mongoose.connect(uri as string);
      console.log('✅ MongoDB connected successfully');
      connected = true;
      break;
    } catch (error) {
      console.log(`❌ Failed to connect to: ${uri}`);
      lastError = error;
      // Continue to next connection string
    }
  }

  if (!connected) {
    console.error('💥 Could not connect to any MongoDB instance');
    console.error('Last error:', lastError);
    console.error('\n🛠️  Possible solutions:');
    console.error('   1. Make sure MongoDB is running locally on port 27017');
    console.error('   2. Start the application using Docker Compose: docker-compose up');
    console.error('   3. Set the MONGODB_URI environment variable to your MongoDB connection string');
    process.exit(1);
  }
}

export default mongoose;

