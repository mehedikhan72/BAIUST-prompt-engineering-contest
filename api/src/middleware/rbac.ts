import { Context, Next } from 'hono';
import { IUser } from '../models/User.js';

export function requireRole(role: 'JUDGE' | 'TEAM') {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as IUser;
    
    if (!user) {
      return c.json({ error: 'Unauthorized - No user found' }, 401);
    }
    
    if (user.role !== role) {
      return c.json({ error: `Forbidden - ${role} role required` }, 403);
    }
    
    await next();
  };
}

