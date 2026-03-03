import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    res.json({
        ok: true,
        message: 'Ping works!',
        env: {
            DATABASE_URL: process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING',
            CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? '✅ SET' : '❌ MISSING',
            GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ SET' : '❌ MISSING',
            GROQ_API_KEY: process.env.GROQ_API_KEY ? '✅ SET' : '❌ MISSING',
            NODE_ENV: process.env.NODE_ENV || 'not set',
        }
    });
}
