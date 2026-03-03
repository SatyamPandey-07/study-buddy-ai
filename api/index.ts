import express, { Request, Response } from 'express';

// Cache references
let _app: express.Express | null = null;
let _initError: string | null = null;

// Lazily load the real server app so initialization errors become
// readable 500 responses instead of FUNCTION_INVOCATION_FAILED crashes.
async function getApp(): Promise<express.Express> {
  if (_app) return _app;
  if (_initError) throw new Error(_initError);
  try {
    const mod = await import('../server/index');
    _app = mod.default as express.Express;
    return _app;
  } catch (err: any) {
    _initError = err?.message || String(err);
    console.error('[api/index] Failed to initialize server:', _initError);
    throw err;
  }
}

// Vercel calls this as an HTTP handler
const handler = async (req: Request, res: Response) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.error('[api/index] Initialization error:', err);
    res.status(500).json({
      error: 'Server failed to initialize',
      message: err?.message || String(err),
      hint: 'Check that all required environment variables are set in your Vercel dashboard: DATABASE_URL, CLERK_SECRET_KEY, GROQ_API_KEY',
    });
  }
};

export default handler;

