import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import explainRoutes from './routes/explain';
import summarizeRoutes from './routes/summarize';
import quizRoutes from './routes/quiz';
import flashcardRoutes from './routes/flashcard';
import uploadRoutes from './routes/upload';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:8080', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Study Buddy API is running' });
});

// API Routes
app.use('/api/explain', explainRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/flashcard', flashcardRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use((err: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
