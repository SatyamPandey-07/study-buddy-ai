/// <reference types="../types" />
import { Request, Response, NextFunction } from 'express';

// Cache the clerk client after first successful load
let _clerkClient: any = null;

// Lazy-load clerkClient so missing CLERK_SECRET_KEY doesn't crash at module init
async function getClerkClient() {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is not set. Please add it in your Vercel dashboard under Settings > Environment Variables.');
  }
  if (!_clerkClient) {
    const mod = await import('@clerk/clerk-sdk-node');
    _clerkClient = mod.clerkClient;
  }
  return _clerkClient;
}

// Middleware to verify Clerk token and add user info to request
export const requireAuth = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!process.env.CLERK_SECRET_KEY) {
        res.status(503).json({ error: 'Authentication service not configured. CLERK_SECRET_KEY is missing from environment variables.' });
        return;
      }

      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized - No token provided' });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      const clerkClient = await getClerkClient();

      // Verify the token with Clerk
      const session = await clerkClient.verifyToken(token);
      
      if (!session || !session.sub) {
        res.status(401).json({ error: 'Unauthorized - Invalid token' });
        return;
      }

      // Get user details
      const user = await clerkClient.users.getUser(session.sub);

      // Add auth info to request
      req.auth = {
        userId: session.sub,
        sessionClaims: {
          email: user.emailAddresses[0]?.emailAddress,
          name: user.firstName || user.username || undefined,
        },
      };

      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ error: 'Unauthorized - Authentication failed' });
    }
  };
};

export default requireAuth;
