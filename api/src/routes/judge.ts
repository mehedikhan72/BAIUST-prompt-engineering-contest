import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { User } from '../models/User.js';
import { Phase } from '../models/Phase.js';
import { Level } from '../models/Level.js';
import { Submission } from '../models/Submission.js';
import { applyJudgeBonus } from '../services/penalty.js';
import { Contest } from '../models/Contest.js';

const judge = new Hono();

// Apply auth and judge role to all routes
judge.use('/*', authMiddleware);
judge.use('/*', requireRole('JUDGE'));

// ===== Phase Management =====
judge.put('/phases/:phaseNumber', async (c) => {
  try {
    const phaseNumber = parseInt(c.req.param('phaseNumber'));
    const { name, description, unlockCriteria } = await c.req.json();
    
    const phase = await Phase.findOneAndUpdate(
      { phaseNumber },
      { name, description, unlockCriteria },
      { new: true, upsert: true }
    );
    
    return c.json({ phase });
  } catch (error: any) {
    console.error('Update phase error:', error);
    return c.json({ error: 'Failed to update phase' }, 500);
  }
});

judge.get('/phases', async (c) => {
  try {
    const phases = await Phase.find().sort({ phaseNumber: 1 });
    return c.json({ phases });
  } catch (error: any) {
    console.error('Get phases error:', error);
    return c.json({ error: 'Failed to get phases' }, 500);
  }
});

// ===== Level Management =====
judge.put('/levels/:phaseNumber/:levelNumber', async (c) => {
  try {
    const phaseNumber = parseInt(c.req.param('phaseNumber'));
    const levelNumber = parseInt(c.req.param('levelNumber'));
    const { name, description, referenceImage, assets, maxScore } = await c.req.json();
    
    const level = await Level.findOneAndUpdate(
      { phaseNumber, levelNumber },
      { name, description, referenceImage, assets, maxScore },
      { new: true, upsert: true }
    );
    
    return c.json({ level });
  } catch (error: any) {
    console.error('Update level error:', error);
    return c.json({ error: 'Failed to update level' }, 500);
  }
});

judge.get('/levels', async (c) => {
  try {
    const levels = await Level.find().sort({ phaseNumber: 1, levelNumber: 1 });
    return c.json({ levels });
  } catch (error: any) {
    console.error('Get levels error:', error);
    return c.json({ error: 'Failed to get levels' }, 500);
  }
});

judge.get('/levels/:phaseNumber', async (c) => {
  try {
    const phaseNumber = parseInt(c.req.param('phaseNumber'));
    const levels = await Level.find({ phaseNumber }).sort({ levelNumber: 1 });
    return c.json({ levels });
  } catch (error: any) {
    console.error('Get levels error:', error);
    return c.json({ error: 'Failed to get levels' }, 500);
  }
});

// ===== File Upload =====
judge.post('/upload', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Determine content type
    let contentType = file.type || 'application/octet-stream';
    
    // Upload to Bunny (using judge folder)
    const filename = `${Date.now()}-${file.name}`;
    const url = await uploadFile(buffer, 'judge', filename, contentType);
    
    return c.json({ url });
  } catch (error: any) {
    console.error('Upload error:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// ===== Team Management =====
judge.get('/teams', async (c) => {
  try {
    const teams = await User.find({ role: 'TEAM' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    return c.json({ teams });
  } catch (error: any) {
    console.error('Get teams error:', error);
    return c.json({ error: 'Failed to get teams' }, 500);
  }
});

judge.post('/teams', async (c) => {
  try {
    const { email, password, teamName, participants } = await c.req.json();
    
    if (!email || !password || !teamName) {
      return c.json({ error: 'Email, password, and team name are required' }, 400);
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return c.json({ error: 'Email already exists' }, 400);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const team = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'TEAM',
      teamName,
      participants: participants || []
    });
    
    return c.json({ 
      team: {
        id: team._id,
        email: team.email,
        teamName: team.teamName,
        participants: team.participants
      }
    }, 201);
  } catch (error: any) {
    console.error('Create team error:', error);
    return c.json({ error: 'Failed to create team' }, 500);
  }
});

judge.put('/teams/:teamId', async (c) => {
  try {
    const teamId = c.req.param('teamId');
    const { teamName, participants, email } = await c.req.json();
    
    const updateData: any = {};
    if (teamName) updateData.teamName = teamName;
    if (participants) updateData.participants = participants;
    if (email) updateData.email = email.toLowerCase();
    
    const team = await User.findOneAndUpdate(
      { _id: teamId, role: 'TEAM' },
      updateData,
      { new: true }
    ).select('-password');
    
    if (!team) {
      return c.json({ error: 'Team not found' }, 404);
    }
    
    return c.json({ team });
  } catch (error: any) {
    console.error('Update team error:', error);
    return c.json({ error: 'Failed to update team' }, 500);
  }
});

// ===== Submission Judging =====
judge.get('/submissions/pending', async (c) => {
  try {
    const submissions = await Submission.find({ status: 'PENDING' })
      .populate('teamId', 'teamName email')
      .sort({ submittedAt: 1 });
    
    return c.json({ submissions });
  } catch (error: any) {
    console.error('Get pending submissions error:', error);
    return c.json({ error: 'Failed to get submissions' }, 500);
  }
});

judge.get('/submissions', async (c) => {
  try {
    const submissions = await Submission.find()
      .populate('teamId', 'teamName email')
      .populate('judgedBy', 'email')
      .sort({ submittedAt: -1 });
    
    return c.json({ submissions });
  } catch (error: any) {
    console.error('Get submissions error:', error);
    return c.json({ error: 'Failed to get submissions' }, 500);
  }
});

judge.put('/submissions/:submissionId/judge', async (c) => {
  try {
    const submissionId = c.req.param('submissionId');
    const { score, canResubmit } = await c.req.json();
    const judgeUser = c.get('user');
    
    if (score === undefined || score < 0) {
      return c.json({ error: 'Valid score is required' }, 400);
    }
    
    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }
    
    if (submission.status === 'JUDGED') {
      return c.json({ error: 'Submission already judged' }, 400);
    }
    
    // Get max score from level
    const level = await Level.findOne({
      phaseNumber: submission.phaseNumber,
      levelNumber: submission.levelNumber
    });
    
    const maxScore = level?.maxScore || 10;
    
    if (score > maxScore) {
      return c.json({ error: `Score cannot exceed ${maxScore}` }, 400);
    }
    
    // Apply judge bonus (subtract from penalty)
    await applyJudgeBonus(submission.teamId.toString(), score, maxScore);
    
    // Update submission
    submission.status = 'JUDGED';
    submission.judgeScore = score;
    submission.judgedBy = judgeUser._id;
    submission.judgedAt = new Date();
    submission.canResubmit = canResubmit || false;
    
    await submission.save();
    
    return c.json({ submission });
  } catch (error: any) {
    console.error('Judge submission error:', error);
    return c.json({ error: 'Failed to judge submission' }, 500);
  }
});

// ===== Contest Settings =====
// Get active contest
judge.get('/contest', async (c) => {
  try {
    const contest = await Contest.findOne({ isActive: true });
    if (!contest) {
      return c.json({ contest: null });
    }
    return c.json({
      contest: {
        startTime: contest.startTime,
        endTime: contest.endTime,
        isActive: contest.isActive,
      },
    });
  } catch (error: any) {
    console.error('Get contest error:', error);
    return c.json({ error: 'Failed to get contest' }, 500);
  }
});

// Create/update active contest
judge.put('/contest', async (c) => {
  try {
    const body = await c.req.json();
    const { startTime, endTime, isActive } = body as { startTime?: string; endTime?: string; isActive?: boolean };

    if (!startTime || !endTime) {
      return c.json({ error: 'startTime and endTime are required' }, 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return c.json({ error: 'Invalid startTime or endTime' }, 400);
    }
    if (end.getTime() <= start.getTime()) {
      return c.json({ error: 'endTime must be after startTime' }, 400);
    }

    let contest = await Contest.findOne({ isActive: true });
    if (!contest) {
      contest = new Contest({ startTime: start, endTime: end, isActive: isActive ?? true });
    } else {
      contest.startTime = start;
      contest.endTime = end;
      if (typeof isActive === 'boolean') {
        contest.isActive = isActive;
      }
    }

    await contest.save();
    return c.json({
      contest: {
        startTime: contest.startTime,
        endTime: contest.endTime,
        isActive: contest.isActive,
      },
    });
  } catch (error: any) {
    console.error('Update contest error:', error);
    return c.json({ error: 'Failed to update contest' }, 500);
  }
});

export default judge;

