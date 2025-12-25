import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Middleware to verify Clerk token and add user info to request
export const requireAuth = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized - No token provided' });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

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
