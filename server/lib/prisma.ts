import { PrismaClient } from '@prisma/client';
import { neon } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('⚠️ DATABASE_URL is not defined in environment variables');
}

function createPrismaClient() {
  if (connectionString) {
    try {
      const sql = neon(connectionString);
      const adapter = new PrismaNeon(sql);
      return new PrismaClient({ adapter } as any);
    } catch (e) {
      console.error('Failed to create Neon adapter, falling back to standard client:', e);
    }
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
