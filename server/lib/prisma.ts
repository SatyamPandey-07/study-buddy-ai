import { PrismaClient } from '@prisma/client';
import { neon } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const globalForPrisma = global as unknown as { prisma: PrismaClient | null };

function createPrismaClient(): PrismaClient | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('⚠️ DATABASE_URL is not defined in environment variables');
    return null;
  }
  try {
    const sql = neon(connectionString);
    const adapter = new PrismaNeon(sql);
    return new PrismaClient({ adapter } as any);
  } catch (e) {
    console.error('Failed to create Neon adapter, falling back to standard client:', e);
    try {
      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    } catch (e2) {
      console.error('Failed to create fallback Prisma client:', e2);
      return null;
    }
  }
}

const _prismaClient = globalForPrisma.prisma !== undefined
  ? globalForPrisma.prisma
  : (globalForPrisma.prisma = createPrismaClient());

export function getPrisma(): PrismaClient {
  if (!_prismaClient) {
    throw new Error('DATABASE_URL is not set. Please add it in your Vercel dashboard under Settings > Environment Variables.');
  }
  return _prismaClient;
}

// Proxy export: throws descriptive error on use if DATABASE_URL is missing
export const prisma: PrismaClient = _prismaClient
  ? _prismaClient
  : (new Proxy({} as PrismaClient, {
      get(_target, prop) {
        throw new Error(
          `DATABASE_URL is not set. Cannot use database. Please add it in your Vercel dashboard under Settings > Environment Variables. (accessed: ${String(prop)})`
        );
      },
    }));

export default prisma;
