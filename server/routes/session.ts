import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { getOrCreateUser } from '../lib/user.js';
import { z } from 'zod';

const db = prisma as any;

const router = Router();

const sessionSchema = z.object({
  module: z.enum(['explain', 'quiz', 'flashcards', 'summarize', 'resource', 'general']),
  duration: z.number().min(1).max(7200),
  focusScore: z.number().min(0).max(100).optional(),
  completed: z.boolean().optional(),
});

// Start a study session
router.post('/start', requireAuth(), async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const { module } = z.object({
      module: z.enum(['explain', 'quiz', 'flashcards', 'summarize', 'resource', 'general']),
    }).parse(req.body);

    const user = await getOrCreateUser(
      clerkId,
      req.auth.sessionClaims?.email as string,
      req.auth.sessionClaims?.name as string,
    );

    const session = await db.studySession.create({
      data: { userId: user.id, module, duration: 0, completed: false, startedAt: new Date() },
    });

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

// End a study session
router.post('/end', requireAuth(), async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const { module, duration, focusScore } = sessionSchema.parse(req.body);

    const user = await getOrCreateUser(
      clerkId,
      req.auth.sessionClaims?.email as string,
      req.auth.sessionClaims?.name as string,
    );

    const session = await db.studySession.create({
      data: { userId: user.id, module, duration, focusScore, completed: true, endedAt: new Date() },
    });

    await updateUserStreak(user.id, duration);

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

// Get today's sessions
router.get('/today', requireAuth(), async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return res.json({ sessions: [], totalTime: 0 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessions = await db.studySession.findMany({
      where: { userId: user.id, startedAt: { gte: today } },
      orderBy: { startedAt: 'desc' },
    });
    const totalTime = sessions.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0);
    res.json({ sessions, totalTime });
  } catch (error) {
    next(error);
  }
});

// Get session statistics
router.get('/stats', requireAuth(), async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return res.json({ totalTime: 0, avgDuration: 0, sessionCount: 0, moduleBreakdown: {}, dailyData: {} });

    const { period = '7d' } = req.query;
    const startDate = new Date();
    if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate.setDate(startDate.getDate() - 7);

    const sessions = await db.studySession.findMany({
      where: { userId: user.id, startedAt: { gte: startDate } },
      orderBy: { startedAt: 'asc' },
    });

    const totalTime = sessions.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0);
    const avgDuration = sessions.length > 0 ? totalTime / sessions.length : 0;
    const moduleBreakdown = sessions.reduce((acc: Record<string, number>, s: { module: string; duration: number }) => {
      acc[s.module] = (acc[s.module] || 0) + s.duration;
      return acc;
    }, {});
    const dailyData = sessions.reduce((acc: Record<string, number>, s: { startedAt: Date; duration: number }) => {
      const date = new Date(s.startedAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + s.duration;
      return acc;
    }, {});

    res.json({ totalTime, avgDuration, sessionCount: sessions.length, moduleBreakdown, dailyData });
  } catch (error) {
    next(error);
  }
});

// Helper: update streak using internal user.id
async function updateUserStreak(userId: string, duration: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await db.userStreak.findUnique({ where: { userId } });

  if (!streak) {
    await db.userStreak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastActivityAt: new Date(), totalStudyTime: duration },
    });
  } else {
    const lastActivity = new Date(streak.lastActivityAt);
    lastActivity.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    const newStreak = daysDiff === 1 ? streak.currentStreak + 1 : daysDiff > 1 ? 1 : streak.currentStreak;

    await db.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastActivityAt: new Date(),
        totalStudyTime: streak.totalStudyTime + duration,
      },
    });
  }
}

export default router;
