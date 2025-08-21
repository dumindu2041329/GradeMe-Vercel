import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../server/app';

// Lazy initialize the Express app to reuse between invocations
let app: ReturnType<typeof createApp> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!app) {
      app = createApp();
    }
    // @ts-ignore - Vercel's req/res are compatible with Express
    return app(req, res);
  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


