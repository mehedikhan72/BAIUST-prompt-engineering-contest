import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import auth from './routes/auth.js';
import judge from './routes/judge.js';
import team from './routes/team.js';
import leaderboard from './routes/leaderboard.js';

// Load environment variables
dotenv.config();

const app = new Hono();

// CORS middleware
app.use('/*', cors({
  origin: ['http://128.199.30.12:3000', 'http://client:3000'],
  credentials: true
}));

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'Contest API Server', 
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy' });
});

// Mount routes
app.route('/api/auth', auth);
app.route('/api/judge', judge);
app.route('/api/team', team);
app.route('/api/leaderboard', leaderboard);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Global error handler:', err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

const port = parseInt(process.env.PORT || '3001');

// Connect to database and start server
connectDB().then(() => {
  serve({
    fetch: app.fetch,
    port
  }, (info) => {
    console.log(`🚀 Server running on http://128.199.30.12:${info.port}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

