import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const db = prisma as any;

const router = Router();

// Resolve internal user.id from Clerk ID
async function getUserId(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  return user?.id ?? null;
}

// Get user streak information
router.get('/', requireAuth(), async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const userId = await getUserId(clerkId);
    if (!userId) return res.json({ streak: { currentStreak: 0, longestStreak: 0, totalStudyTime: 0 } });

    let streak = await db.userStreak.findUnique({ where: { userId } });

    if (!streak) {
      streak = await db.userStreak.create({
        data: { userId, currentStreak: 0, longestStreak: 0, lastActivityAt: new Date(), totalStudyTime: 0 },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivity = new Date(streak.lastActivityAt);
    lastActivity.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 1) {
      streak = await db.userStreak.update({ where: { userId }, data: { currentStreak: 0 } });
    }

    res.json({ streak });
  } catch (error) {
    next(error);
  }
});

// Get achievements/badges
router.get('/achievements', requireAuth(), async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const userId = await getUserId(clerkId);
    if (!userId) return res.json({ achievements: [] });

    const [streak, quizCount, flashcardCount, sessionCount] = await Promise.all([
      db.userStreak.findUnique({ where: { userId } }),
      prisma.quiz.count({ where: { userId, completed: true } }),
      prisma.flashcardSet.count({ where: { userId } }),
      db.studySession.count({ where: { userId } }),
    ]);

    const achievements: { id: string; name: string; icon: string; unlocked: boolean }[] = [];

    if (streak?.currentStreak >= 3) achievements.push({ id: 'streak_3', name: '3-Day Streak', icon: '🔥', unlocked: true });
    if (streak?.currentStreak >= 7) achievements.push({ id: 'streak_7', name: '7-Day Streak', icon: '🔥🔥', unlocked: true });
    if (streak?.currentStreak >= 30) achievements.push({ id: 'streak_30', name: '30-Day Streak', icon: '🔥🔥🔥', unlocked: true });
    if (quizCount >= 1) achievements.push({ id: 'quiz_first', name: 'First Quiz', icon: '🎯', unlocked: true });
    if (quizCount >= 10) achievements.push({ id: 'quiz_10', name: 'Quiz Master', icon: '🎓', unlocked: true });
    if (flashcardCount >= 1) achievements.push({ id: 'flashcard_first', name: 'First Flashcard Set', icon: '📇', unlocked: true });
    if (flashcardCount >= 5) achievements.push({ id: 'flashcard_5', name: 'Flashcard Pro', icon: '📚', unlocked: true });
    if (streak?.totalStudyTime >= 3600) achievements.push({ id: 'time_1h', name: '1 Hour Studied', icon: '⏱️', unlocked: true });
    if (streak?.totalStudyTime >= 36000) achievements.push({ id: 'time_10h', name: '10 Hours Studied', icon: '⏰', unlocked: true });
    if (sessionCount >= 1) achievements.push({ id: 'session_first', name: 'First Session', icon: '⏰', unlocked: true });

    res.json({ achievements });
  } catch (error) {
    next(error);
  }
});

// Get overall statistics dashboard
router.get('/dashboard', requireAuth(), async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    const userId = await getUserId(clerkId);

    if (!userId) {
      return res.json({
        streak: { currentStreak: 0, longestStreak: 0, totalStudyTime: 0 },
        stats: { totalQuizzes: 0, completedQuizzes: 0, totalFlashcards: 0, totalSummaries: 0, totalResources: 0 },
        recentSessions: [],
        activityByDate: {},
      });
    }

    const [
      streak,
      totalQuizzes,
      completedQuizzes,
      totalFlashcards,
      totalSummaries,
      totalResources,
      recentSessions,
    ] = await Promise.all([
      db.userStreak.findUnique({ where: { userId } }),
      prisma.quiz.count({ where: { userId } }),
      prisma.quiz.count({ where: { userId, completed: true } }),
      prisma.flashcardSet.count({ where: { userId } }),
      prisma.summary.count({ where: { userId } }),
      db.resource.count({ where: { userId } }),
      db.studySession.findMany({ where: { userId }, orderBy: { startedAt: 'desc' }, take: 10 }),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await db.studySession.findMany({
      where: { userId, startedAt: { gte: thirtyDaysAgo } },
      orderBy: { startedAt: 'asc' },
    });

    const activityByDate = recentActivity.reduce(
      (acc: Record<string, { count: number; duration: number }>, session: { startedAt: Date; duration: number }) => {
        const date = new Date(session.startedAt).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { count: 0, duration: 0 };
        acc[date].count++;
        acc[date].duration += session.duration;
        return acc;
      },
      {},
    );

    res.json({
      streak: streak || { currentStreak: 0, longestStreak: 0, totalStudyTime: 0 },
      stats: { totalQuizzes, completedQuizzes, totalFlashcards, totalSummaries, totalResources },
      recentSessions,
      activityByDate,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
