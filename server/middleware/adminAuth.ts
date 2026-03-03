import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

const db = prisma as any;

export const requireAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clerkId = req.auth?.userId;
      if (!clerkId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await db.user.findUnique({
        where: { clerkId },
        select: { id: true, role: true },
      });

      if (!user || user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
