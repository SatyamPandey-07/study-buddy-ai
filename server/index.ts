import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables at startup
const REQUIRED_ENV_VARS = ['CLERK_SECRET_KEY', 'DATABASE_URL', 'GROQ_API_KEY'];
const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`⚠️ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please set these in your Vercel dashboard under Settings > Environment Variables');
}

// Import routes
import explainRoutes from './routes/explain.js';
import summarizeRoutes from './routes/summarize.js';
import quizRoutes from './routes/quiz.js';
import flashcardRoutes from './routes/flashcard.js';
import uploadRoutes from './routes/upload.js';
import sessionRoutes from './routes/session.js';
import streakRoutes from './routes/streak.js';
import resourceRoutes from './routes/resource.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import adminRoutes from './routes/admin.js';

// 20 AI requests per user per minute
const aiRateLimiter = createRateLimiter(20, 60 * 1000);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:8080',
  'http://localhost:5173',
  'https://study-buddy-ai-lovat.vercel.app'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.some(o => origin === o || (o.includes(',') && o.split(',').map(s => s.trim()).includes(origin)))) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const fullPath = `${req.method} ${req.path}`;
  console.log(`[${new Date().toISOString()}] Incoming request: ${fullPath}`);
  console.log(`[${new Date().toISOString()}] Original URL: ${req.originalUrl}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Study Buddy API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Study Buddy API is running' });
});

// Debug endpoint - shows which env vars are set (values masked)
app.get('/api/debug', (req, res) => {
  res.json({
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? '✅ SET' : '❌ MISSING',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ SET' : '❌ MISSING',
      GROQ_API_KEY: process.env.GROQ_API_KEY ? '✅ SET' : '❌ MISSING',
      NODE_ENV: process.env.NODE_ENV || 'not set',
    }
  });
});

// API Routes
app.use('/api/explain', aiRateLimiter, explainRoutes);
app.use('/api/summarize', aiRateLimiter, summarizeRoutes);
app.use('/api/quiz', aiRateLimiter, quizRoutes);
app.use('/api/flashcard', aiRateLimiter, flashcardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/resource', resourceRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
  console.error('SERVER ERROR:', err.message);
  console.error('STACK:', err.stack);

  const errorMessage = typeof err === 'string' ? err : err.message || 'Internal server error';

  // Return env var errors as 503 with clear message
  if (errorMessage.includes('environment variable')) {
    return res.status(503).json({
      error: errorMessage,
    });
  }

  // Handle Zod validation errors with 400
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: (err as any).errors,
    });
  }

  res.status(err.status || 500).json({
    error: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')}`);
  });
}

export default app;
