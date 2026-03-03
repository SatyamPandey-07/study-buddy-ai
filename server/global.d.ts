import 'express';

declare global {
  namespace Express {
    interface Request {
      auth: {
        userId: string;
        sessionClaims?: {
          email?: string;
          name?: string;
          [key: string]: unknown;
        };
      };
    }
  }
}
