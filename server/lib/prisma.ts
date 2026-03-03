import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('⚠️ DATABASE_URL is not defined in environment variables');
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(connectionString && {
      datasources: {
        db: {
          url: connectionString,
        },
      },
    }),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
