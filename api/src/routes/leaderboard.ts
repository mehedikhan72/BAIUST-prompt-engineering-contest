import { Hono } from 'hono';
import { User } from '../models/User.js';
import { TeamProgress } from '../models/TeamProgress.js';
import { Submission } from '../models/Submission.js';

const leaderboard = new Hono();

// Public leaderboard (no auth required)
leaderboard.get('/', async (c) => {
  try {
    const teams = await User.find({ role: 'TEAM' }).select('_id teamName');
    
    const leaderboardData = await Promise.all(
      teams.map(async (team) => {
        const progress = await TeamProgress.findOne({ teamId: team._id });
        
        if (!progress) {
          return {
            teamId: team._id,
            teamName: team.teamName,
            totalPenalty: 0,
            completedLevels: [],
            phase1Completed: [],
            phase2Completed: [],
            phase2Scores: [],
            phase3Completed: [],
            phase3Score: null,
            lastSubmissionTime: null
          };
        }
        
        // Get Phase 2 and 3 submissions with scores
        const phase2Submissions = await Submission.find({
          teamId: team._id,
          phaseNumber: 2,
          status: 'JUDGED'
        }).select('levelNumber judgeScore');
        
        const phase3Submission = await Submission.findOne({
          teamId: team._id,
          phaseNumber: 3,
          status: 'JUDGED'
        }).select('judgeScore');
        
        // Organize completed levels by phase
        const phase1Completed = progress.completedLevels
          .filter(cl => cl.phase === 1)
          .map(cl => cl.level)
          .sort((a, b) => a - b);
        
        const phase2Completed = progress.completedLevels
          .filter(cl => cl.phase === 2)
          .map(cl => cl.level)
          .sort((a, b) => a - b);
        
        const phase3Completed = progress.completedLevels
          .filter(cl => cl.phase === 3)
          .map(cl => cl.level);
        
        // Map Phase 2 scores
        const phase2Scores = phase2Submissions.map(sub => ({
          level: sub.levelNumber,
          score: sub.judgeScore || 0
        }));
        
        return {
          teamId: team._id,
          teamName: team.teamName,
          totalPenalty: progress.totalPenalty,
          completedLevels: progress.completedLevels,
          phase1Completed,
          phase2Completed,
          phase2Scores,
          phase3Completed,
          phase3Score: phase3Submission?.judgeScore || null,
          lastSubmissionTime: progress.lastSubmissionTime
        };
      })
    );
    
    // Sort by penalty (ascending), then by last submission time (ascending)
    leaderboardData.sort((a, b) => {
      if (a.totalPenalty !== b.totalPenalty) {
        return a.totalPenalty - b.totalPenalty;
      }
      
      if (!a.lastSubmissionTime) return 1;
      if (!b.lastSubmissionTime) return -1;
      
      return new Date(a.lastSubmissionTime).getTime() - new Date(b.lastSubmissionTime).getTime();
    });
    
    return c.json({ leaderboard: leaderboardData });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return c.json({ error: 'Failed to get leaderboard' }, 500);
  }
});

export default leaderboard;

