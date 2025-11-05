import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Phase } from '../models/Phase.js';
import { Level } from '../models/Level.js';
import { TeamProgress } from '../models/TeamProgress.js';
import { Submission } from '../models/Submission.js';
import { generateImage } from '../services/imageGen.js';
import { uploadImage, uploadFile } from '../services/bunny.js';
import axios from 'axios';
import { AI_AGENT_SERVICE_URL } from '../utils/constants.js';
import { 
  checkLevelAccess, 
  checkLevelCompleted, 
  unlockNextLevel 
} from '../services/unlock.js';
import { 
  addCorrectGuessPenalty, 
  addWrongGuessPenalty 
} from '../services/penalty.js';
import { Contest } from '../models/Contest.js';

const team = new Hono();

// Apply auth and team role to all routes
team.use('/*', authMiddleware);
team.use('/*', requireRole('TEAM'));

async function contestHasEnded(): Promise<boolean> {
  const contest = await Contest.findOne({ isActive: true });
  if (!contest) return false;
  const now = new Date();
  return now.getTime() >= contest.endTime.getTime();
}

// ===== Get Phases with Unlock Status =====
team.get('/phases', async (c) => {
  try {
    const user = c.get('user');
    const progress = await TeamProgress.findOne({ teamId: user._id });
    const phases = await Phase.find().sort({ phaseNumber: 1 });
    
    const phasesWithStatus = phases.map(phase => ({
      ...phase.toObject(),
      unlocked: progress?.unlockedPhases.includes(phase.phaseNumber) || false
    }));
    
    return c.json({ phases: phasesWithStatus });
  } catch (error: any) {
    console.error('Get phases error:', error);
    return c.json({ error: 'Failed to get phases' }, 500);
  }
});

// ===== Get Levels for a Phase (only unlocked ones) =====
team.get('/phases/:phaseNumber/levels', async (c) => {
  try {
    const user = c.get('user');
    const phaseNumber = parseInt(c.req.param('phaseNumber'));
    
    const progress = await TeamProgress.findOne({ teamId: user._id });
    
    if (!progress?.unlockedPhases.includes(phaseNumber)) {
      return c.json({ error: 'Phase not unlocked' }, 403);
    }
    
    const allLevels = await Level.find({ phaseNumber }).sort({ levelNumber: 1 });
    
    // Filter to only show unlocked levels
    const levelsWithStatus = allLevels.map(level => {
      let unlocked = false;
      
      // Phase 2: All levels are unlocked if phase is unlocked
      if (phaseNumber === 2) {
        unlocked = true;
      } else {
        // Other phases: Check individual level unlock status
        unlocked = progress.unlockedLevels.some(
          ul => ul.phase === phaseNumber && ul.level === level.levelNumber
        );
      }
      
      const completed = progress.completedLevels.some(
        cl => cl.phase === phaseNumber && cl.level === level.levelNumber
      );
      
      if (unlocked) {
        return {
          ...level.toObject(),
          unlocked: true,
          completed
        };
      }
      return null;
    }).filter(Boolean);
    
    return c.json({ levels: levelsWithStatus });
  } catch (error: any) {
    console.error('Get levels error:', error);
    return c.json({ error: 'Failed to get levels' }, 500);
  }
});

// ===== Phase 1: Prompt (proxy to ai-agent-service) =====
team.post('/phase1/:levelNumber/prompt', async (c) => {
  try {
    if (await contestHasEnded()) {
      return c.json({ error: 'Contest has ended' }, 403);
    }
    const user = c.get('user');
    const levelNumber = parseInt(c.req.param('levelNumber'));
    const { prompt } = await c.req.json();
    
    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }
    
    // Validate access
    const hasAccess = await checkLevelAccess(user._id, 1, levelNumber);
    if (!hasAccess) {
      return c.json({ error: 'Level not unlocked' }, 403);
    }
    
    const isCompleted = await checkLevelCompleted(user._id, 1, levelNumber);
    if (isCompleted) {
      return c.json({ error: 'Level already completed' }, 400);
    }
    
    // Map level number to ai-agent-service level format
    const levelMap: { [key: number]: string } = {
      1: 'ONE',
      2: 'TWO',
      3: 'THREE',
      4: 'FOUR',
      5: 'FIVE'
    };
    
    const level = levelMap[levelNumber];
    
    // Proxy to ai-agent-service
    const response = await axios.post(
      `${AI_AGENT_SERVICE_URL}/process-prompt/`,
      null,
      {
        params: { prompt, level }
      }
    );
    
    return c.json({ response: response.data });
  } catch (error: any) {
    console.error('Phase 1 prompt error:', error);
    if (error.response) {
      return c.json({ error: error.response.data }, error.response.status);
    }
    return c.json({ error: 'Failed to process prompt' }, 500);
  }
});

// ===== Phase 1: Guess (proxy to ai-agent-service) =====
team.post('/phase1/:levelNumber/guess', async (c) => {
  try {
    if (await contestHasEnded()) {
      return c.json({ error: 'Contest has ended' }, 403);
    }
    const user = c.get('user');
    const levelNumber = parseInt(c.req.param('levelNumber'));
    const { guess } = await c.req.json();
    
    if (!guess) {
      return c.json({ error: 'Guess is required' }, 400);
    }
    
    // Validate access
    const hasAccess = await checkLevelAccess(user._id, 1, levelNumber);
    if (!hasAccess) {
      return c.json({ error: 'Level not unlocked' }, 403);
    }
    
    const isCompleted = await checkLevelCompleted(user._id, 1, levelNumber);
    if (isCompleted) {
      return c.json({ error: 'Level already completed' }, 400);
    }
    
    // Map level number to ai-agent-service level format
    const levelMap: { [key: number]: string } = {
      1: 'ONE',
      2: 'TWO',
      3: 'THREE',
      4: 'FOUR',
      5: 'FIVE'
    };
    
    const level = levelMap[levelNumber];
    
    // Proxy to ai-agent-service
    const response = await axios.post(
      `${AI_AGENT_SERVICE_URL}/process-guess/`,
      null,
      {
        params: { guess, level }
      }
    );
    
    const isCorrect = response.data.correct;
    
    if (isCorrect) {
      // Add penalty for correct guess and unlock next level
      const penalty = await addCorrectGuessPenalty(user._id.toString());
      await unlockNextLevel(user._id, 1, levelNumber);
      
      return c.json({ 
        correct: true, 
        message: 'Correct! Level completed.',
        penalty 
      });
    } else {
      // Add penalty for wrong guess
      await addWrongGuessPenalty(user._id.toString(), 1, levelNumber);
      
      return c.json({ 
        correct: false, 
        message: 'Incorrect guess. 10 minutes penalty added.' 
      });
    }
  } catch (error: any) {
    console.error('Phase 1 guess error:', error);
    if (error.response) {
      return c.json({ error: error.response.data }, error.response.status);
    }
    return c.json({ error: 'Failed to process guess' }, 500);
  }
});

// ===== Phase 2: Generate Image with Progress Updates =====
team.post('/phase2/:levelNumber/generate', async (c) => {
  try {
    if (await contestHasEnded()) {
      return c.json({ error: 'Contest has ended' }, 403);
    }
    const user = c.get('user');
    const levelNumber = parseInt(c.req.param('levelNumber'));
    const body = await c.req.parseBody();
    
    const prompt = body.prompt as string;
    const referenceImageFile = body.referenceImage as File;
    
    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }
    
    // Validate access
    const hasAccess = await checkLevelAccess(user._id, 2, levelNumber);
    if (!hasAccess) {
      return c.json({ error: 'Level not unlocked' }, 403);
    }
    
    // Get level assets and reference image
    const level = await Level.findOne({ phaseNumber: 2, levelNumber });
    if (!level) {
      return c.json({ error: 'Level not found' }, 404);
    }
    
    console.log('🎨 Starting image generation for level:', levelNumber);
    console.log('User:', user._id);
    console.log('Prompt:', prompt);
    console.log('Has reference image:', !!referenceImageFile);
    
    // Convert reference image file to buffer if provided
    let referenceImageBuffer: Buffer | undefined;
    if (referenceImageFile) {
      console.log('📷 Processing reference image:', referenceImageFile.name);
      referenceImageBuffer = Buffer.from(await referenceImageFile.arrayBuffer());
    }
    
    // Collect user assets
    const userAssets: Buffer[] = [];
    let assetIndex = 0;
    while (body[`asset_${assetIndex}`]) {
      const assetFile = body[`asset_${assetIndex}`] as File;
      if (assetFile) {
        console.log(`📎 Processing user asset ${assetIndex}:`, assetFile.name);
        userAssets.push(Buffer.from(await assetFile.arrayBuffer()));
      }
      assetIndex++;
    }
    
    // Generate image using AI with reference image and assets
    console.log('🚀 Calling generateImage function...');
    const imageBuffer = await generateImage(
      prompt, 
      level.assets || [], 
      referenceImageBuffer,
      userAssets
    );
    
    // Convert buffer to base64 for immediate preview
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    console.log('✅ Image generation completed, returning base64 result');
    
    return c.json({ 
      imageUrl: base64Image,
      message: 'Image generated successfully' 
    });
    
  } catch (error: any) {
    console.error('❌ Phase 2 generate error:', error);
    return c.json({ error: error.message || 'Failed to generate image' }, 500);
  }
});

// ===== Phase 2: Upload Image =====
team.post('/phase2/:levelNumber/upload', async (c) => {
  try {
    if (await contestHasEnded()) {
      return c.json({ error: 'Contest has ended' }, 403);
    }
    const user = c.get('user');
    const levelNumber = parseInt(c.req.param('levelNumber'));
    const body = await c.req.parseBody();
    
    const imageFile = body.image as File;
    
    if (!imageFile) {
      return c.json({ error: 'Image file is required' }, 400);
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return c.json({ error: 'Invalid file type. Only JPG, PNG, and WEBP are allowed' }, 400);
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (imageFile.size > maxSize) {
      return c.json({ error: 'File size exceeds 10MB limit' }, 400);
    }
    
    // Validate access
    const hasAccess = await checkLevelAccess(user._id, 2, levelNumber);
    if (!hasAccess) {
      return c.json({ error: 'Level not unlocked' }, 403);
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Upload to Bunny
    const bunnyUrl = await uploadImage(buffer, user._id.toString());
    
    return c.json({ imageUrl: bunnyUrl });
  } catch (error: any) {
    console.error('Phase 2 upload error:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// ===== Phase 2: Submit =====
team.post('/phase2/:levelNumber/submit', async (c) => {
  try {
    if (await contestHasEnded()) {
      return c.json({ error: 'Contest has ended' }, 403);
    }
    const user = c.get('user');
    const levelNumber = parseInt(c.req.param('levelNumber'));
    const { prompt, imageUrl } = await c.req.json();
    
    if (!prompt || !imageUrl) {
      return c.json({ error: 'Prompt and image URL are required' }, 400);
    }
    
    // Validate access
    const hasAccess = await checkLevelAccess(user._id, 2, levelNumber);
    if (!hasAccess) {
      return c.json({ error: 'Level not unlocked' }, 403);
    }
    
    // Check if there's already a pending submission for this level
    const pendingSubmission = await Submission.findOne({
      teamId: user._id,
      phaseNumber: 2,
      levelNumber,
      status: 'PENDING'
    });
    
    if (pendingSubmission) {
      return c.json({ error: 'You already have a pending submission for this level' }, 400);
    }
    
    // Check if last submission allows resubmit
    const lastSubmission = await Submission.findOne({
      teamId: user._id,
      phaseNumber: 2,
      levelNumber,
      status: 'JUDGED'
    }).sort({ submittedAt: -1 });
    
    if (lastSubmission && !lastSubmission.canResubmit) {
      return c.json({ error: 'Resubmission not allowed for this level' }, 403);
    }
    
    // Convert base64 image to buffer and upload to Bunny for judging
    let finalImageUrl = imageUrl;
    if (imageUrl.startsWith('data:image/')) {
      // Extract base64 data and convert to buffer
      const base64Data = imageUrl.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Upload to Bunny for permanent storage
      finalImageUrl = await uploadImage(imageBuffer, user._id.toString());
      console.log(`📤 Image uploaded to Bunny for submission: ${finalImageUrl}`);
    }
    
    // Create submission
    const submission = await Submission.create({
      teamId: user._id,
      phaseNumber: 2,
      levelNumber,
      type: 'PHASE2_IMAGE',
      content: prompt,
      generatedImageUrl: finalImageUrl,
      status: 'PENDING',
      canResubmit: false
    });
    
    return c.json({ submission }, 201);
  } catch (error: any) {
    console.error('Phase 2 submit error:', error);
    return c.json({ error: 'Failed to submit' }, 500);
  }
});

// ===== Phase 3: Submit =====
team.post('/phase3/submit', async (c) => {
  try {
    if (await contestHasEnded()) {
      return c.json({ error: 'Contest has ended' }, 403);
    }
    const user = c.get('user');
    const body = await c.req.parseBody();
    
    const description = body.description as string;
    const apiEndpoint = body.apiEndpoint as string || '';
    
    // Validate access
    const hasAccess = await checkLevelAccess(user._id, 3, 1);
    if (!hasAccess) {
      return c.json({ error: 'Phase 3 not unlocked' }, 403);
    }
    
    // Check if there's already a pending submission
    const pendingSubmission = await Submission.findOne({
      teamId: user._id,
      phaseNumber: 3,
      status: 'PENDING'
    });
    
    if (pendingSubmission) {
      return c.json({ error: 'You already have a pending submission for Phase 3' }, 400);
    }
    
    // Check if last submission allows resubmit
    const lastSubmission = await Submission.findOne({
      teamId: user._id,
      phaseNumber: 3,
      status: 'JUDGED'
    }).sort({ submittedAt: -1 });
    
    if (lastSubmission && !lastSubmission.canResubmit) {
      return c.json({ error: 'Resubmission not allowed for Phase 3' }, 403);
    }
    
    // Upload files to Bunny
    const fileUrls: string[] = [];
    
    // Handle multiple file uploads
    const files = Object.entries(body).filter(([key, value]) => {
      return key.startsWith('file') && value instanceof File;
    });
    
    for (const [_, file] of files) {
      const fileObj = file as File;
      const buffer = Buffer.from(await fileObj.arrayBuffer());
      const url = await uploadFile(buffer, user._id.toString(), fileObj.name, fileObj.type);
      fileUrls.push(url);
    }
    
    // Create submission with description and files
    const content = JSON.stringify({ description, apiEndpoint });
    
    const submission = await Submission.create({
      teamId: user._id,
      phaseNumber: 3,
      levelNumber: 1,
      type: 'PHASE3_RAG',
      content,
      files: fileUrls,
      status: 'PENDING',
      canResubmit: false
    });
    
    return c.json({ submission }, 201);
  } catch (error: any) {
    console.error('Phase 3 submit error:', error);
    return c.json({ error: 'Failed to submit' }, 500);
  }
});

// ===== Get Team Progress =====
team.get('/progress', async (c) => {
  try {
    const user = c.get('user');
    const progress = await TeamProgress.findOne({ teamId: user._id });
    
    if (!progress) {
      return c.json({ error: 'Progress not found' }, 404);
    }
    
    return c.json({ progress });
  } catch (error: any) {
    console.error('Get progress error:', error);
    return c.json({ error: 'Failed to get progress' }, 500);
  }
});

// ===== Get Team Submissions =====
team.get('/submissions', async (c) => {
  try {
    const user = c.get('user');
    const submissions = await Submission.find({ teamId: user._id })
      .sort({ submittedAt: -1 });
    
    return c.json({ submissions });
  } catch (error: any) {
    console.error('Get submissions error:', error);
    return c.json({ error: 'Failed to get submissions' }, 500);
  }
});

export default team;

