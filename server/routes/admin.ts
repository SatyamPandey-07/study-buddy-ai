import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import prisma from '../lib/prisma.js';

const db = prisma as any;
const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth(), requireAdmin());

// ─────────────────────────────────────────────
// GET /api/admin/check  — role check for frontend
// ─────────────────────────────────────────────
router.get('/check', (_req, res) => {
  res.json({ ok: true });
});

// ─────────────────────────────────────────────
// GET /api/admin/stats  — system-wide overview
// ─────────────────────────────────────────────
router.get('/stats', async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalQuizzes,
      totalFlashcardSets,
      totalSummaries,
      totalSessions,
      totalResources,
      recentSignups,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.quiz.count(),
      prisma.flashcardSet.count(),
      prisma.summary.count(),
      db.studySession.count(),
      db.resource.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 7,
        select: { id: true, createdAt: true },
      }),
    ]);

    // Signups per day for the last 7 days
    const today = new Date();
    const signupsByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      signupsByDay[d.toISOString().split('T')[0]] = 0;
    }
    recentSignups.forEach((u: { createdAt: Date }) => {
      const key = u.createdAt.toISOString().split('T')[0];
      if (key in signupsByDay) signupsByDay[key]++;
    });

    // Total study time (avg sessions)
    const sessionAgg = await db.studySession.aggregate({
      _sum: { duration: true },
      _avg: { duration: true },
    });

    res.json({
      totalUsers,
      totalQuizzes,
      totalFlashcardSets,
      totalSummaries,
      totalSessions,
      totalResources,
      totalStudyTime: sessionAgg._sum?.duration || 0,
      avgSessionDuration: Math.round(sessionAgg._avg?.duration || 0),
      signupsByDay,
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/users  — paginated user list
// ─────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const roleFilter = req.query.role as string | undefined;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (roleFilter === 'ADMIN' || roleFilter === 'USER') {
      where.role = roleFilter;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              quizzes: true,
              flashcards: true,
              summaries: true,
              conversations: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page, hasMore: skip + users.length < total });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// PATCH /api/admin/users/:id/role  — change role
// ─────────────────────────────────────────────
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = z.object({ role: z.enum(['USER', 'ADMIN']) }).parse(req.body);
    const { id } = req.params;

    // Prevent self-demotion
    const callerClerkId = req.auth.userId;
    const caller = await prisma.user.findUnique({ where: { clerkId: callerClerkId }, select: { id: true } });
    if (caller?.id === id && role === 'USER') {
      res.status(400).json({ error: 'Cannot remove your own admin role' });
      return;
    }

    const updated = await db.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// DELETE /api/admin/users/:id  — delete a user
// ─────────────────────────────────────────────
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    const callerClerkId = req.auth.userId;
    const caller = await prisma.user.findUnique({ where: { clerkId: callerClerkId }, select: { id: true } });
    if (caller?.id === id) {
      res.status(400).json({ error: 'Cannot delete your own account from admin panel' });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/activity  — recent sessions across all users
// ─────────────────────────────────────────────
router.get('/activity', async (_req, res, next) => {
  try {
    const sessions = await db.studySession.findMany({
      take: 50,
      orderBy: { startedAt: 'desc' },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

export default router;
