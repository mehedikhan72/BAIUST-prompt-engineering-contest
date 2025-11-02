import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

export interface AuthContext {
  user: IUser;
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const token = authHeader.substring(7);
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }

    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return c.json({ error: 'Unauthorized - User not found' }, 401);
    }

    // Attach user to context
    c.set('user', user);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '6h' });
}

