import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

const router = Router();

const sessionSchema = z.object({
  module: z.enum(['explain', 'quiz', 'flashcards', 'summarize', 'resource']),
  duration: z.number().min(1).max(7200), // max 2 hours
  focusScore: z.number().min(0).max(100).optional(),
  completed: z.boolean().optional(),
});

// Start a study session
router.post('/start', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { module } = z.object({ module: z.enum(['explain', 'quiz', 'flashcards', 'summarize', 'resource']) }).parse(req.body);

    const session = await prisma.studySession.create({
      data: {
        userId,
        module,
        duration: 0,
        completed: false,
        startedAt: new Date(),
      },
    });

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

// End a study session
router.post('/end', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { module, duration, focusScore } = sessionSchema.parse(req.body);

    const session = await prisma.studySession.create({
      data: {
        userId,
        module,
        duration,
        focusScore,
        completed: true,
        endedAt: new Date(),
      },
    });

    // Update user streak and total study time
    await updateUserStreak(userId, duration);

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

// Get today's sessions
router.get('/today', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: {
          gte: today,
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);

    res.json({ sessions, totalTime });
  } catch (error) {
    next(error);
  }
});

// Get session statistics
router.get('/stats', requireAuth(), async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { period = '7d' } = req.query;

    let startDate = new Date();
    if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    }

    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: {
          gte: startDate,
        },
      },
      orderBy: {
        startedAt: 'asc',
      },
    });

    // Calculate stats
    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const avgDuration = sessions.length > 0 ? totalTime / sessions.length : 0;
    const moduleBreakdown = sessions.reduce((acc: any, s) => {
      acc[s.module] = (acc[s.module] || 0) + s.duration;
      return acc;
    }, {});

    // Group by date for heatmap
    const dailyData = sessions.reduce((acc: any, s) => {
      const date = s.startedAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + s.duration;
      return acc;
    }, {});

    res.json({
      totalTime,
      avgDuration,
      sessionCount: sessions.length,
      moduleBreakdown,
      dailyData,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to update user streak
async function updateUserStreak(userId: string, duration: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!streak) {
    // Create new streak
    streak = await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityAt: new Date(),
        totalStudyTime: duration,
      },
    });
  } else {
    const lastActivity = new Date(streak.lastActivityAt);
    lastActivity.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    let newStreak = streak.currentStreak;
    if (daysDiff === 0) {
      // Same day, just update time
      newStreak = streak.currentStreak;
    } else if (daysDiff === 1) {
      // Consecutive day
      newStreak = streak.currentStreak + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, streak.longestStreak);

    await prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityAt: new Date(),
        totalStudyTime: streak.totalStudyTime + duration,
      },
    });
  }
}

export default router;
