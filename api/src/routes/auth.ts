import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { initializeTeamProgress } from '../services/unlock.js';

const auth = new Hono();

// Login endpoint
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Initialize team progress if team role and not exists
    if (user.role === 'TEAM') {
      await initializeTeamProgress(user._id);
    }
    
    const token = generateToken(user._id.toString());
    
    return c.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        teamName: user.teamName,
        participants: user.participants
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get current user
auth.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    return c.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        teamName: user.teamName,
        participants: user.participants
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default auth;

