import { Hono } from 'hono';
import { User } from '../models/User.js';
import { TeamProgress } from '../models/TeamProgress.js';
import { Submission } from '../models/Submission.js';
import { Contest } from '../models/Contest.js';

const leaderboard = new Hono();

// Public leaderboard (no auth required)
leaderboard.get('/', async (c) => {
  try {
    // Get contest info for countdown
    const contest = await Contest.findOne({ isActive: true });
    const teams = await User.find({ role: 'TEAM' }).select('_id teamName');
    
    const leaderboardData = await Promise.all(
      teams.map(async (team) => {
        const progress = await TeamProgress.findOne({ teamId: team._id });
        
        if (!progress) {
          return {
            teamId: team._id,
            teamName: team.teamName,
            totalPenalty: 0,
            problemsSolved: 0,
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
        
        // Calculate total problems solved (ICPC style)
        const problemsSolved = phase1Completed.length + phase2Completed.length + phase3Completed.length;
        
        return {
          teamId: team._id,
          teamName: team.teamName,
          totalPenalty: progress.totalPenalty,
          problemsSolved,
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
    
    // ICPC-style sorting:
    // 1. Problems solved (descending) - most important
    // 2. Total penalty (ascending) - lower penalty is better
    // 3. Last submission time (ascending) - earlier submission wins tie
    leaderboardData.sort((a, b) => {
      // Primary: Number of problems solved (more is better)
      if (a.problemsSolved !== b.problemsSolved) {
        return b.problemsSolved - a.problemsSolved;
      }
      
      // Secondary: Total penalty (less is better)
      if (a.totalPenalty !== b.totalPenalty) {
        return a.totalPenalty - b.totalPenalty;
      }
      
      // Tertiary: Last submission time (earlier is better for tie-breaking)
      if (!a.lastSubmissionTime) return 1;
      if (!b.lastSubmissionTime) return -1;
      
      return new Date(a.lastSubmissionTime).getTime() - new Date(b.lastSubmissionTime).getTime();
    });
    
    return c.json({ 
      leaderboard: leaderboardData,
      contest: contest ? {
        startTime: contest.startTime,
        endTime: contest.endTime,
        isActive: contest.isActive
      } : null
    });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return c.json({ error: 'Failed to get leaderboard' }, 500);
  }
});

export default leaderboard;

