import prisma from './prisma.js';

export async function getOrCreateUser(clerkId: string, email?: string, name?: string) {
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        email: email || `user-${clerkId}@temp.com`,
        name: name || undefined,
      },
    });
  }
  return user;
}
