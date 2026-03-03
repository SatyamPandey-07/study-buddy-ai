import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const env = { ...process.env };

    const debugInfo = {
        method: req.method,
        url: req.url,
        query: req.query,
        hasPrismaLib: false,
        prismaError: null,
        envCount: Object.keys(env).length,
        criticalVars: {
            DATABASE_URL: env.DATABASE_URL ? `Set (Length: ${env.DATABASE_URL.length})` : 'Missing',
            NODE_ENV: env.NODE_ENV,
            VERCEL: env.VERCEL,
            TZ: env.TZ,
        }
    };

    try {
        const { PrismaClient } = require('@prisma/client');
        debugInfo.hasPrismaLib = !!PrismaClient;
        // Don't instantiate, just check if the require works
    } catch (e: any) {
        debugInfo.prismaError = e.message;
    }

    res.status(200).send(`
    <html>
      <body style="font-family: monospace; background: #111; color: #0f0; padding: 20px;">
        <h2>Vercel Debug Info</h2>
        <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
      </body>
    </html>
  `);
}
