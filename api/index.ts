// Lazy initialize the Express app to reuse between invocations
let app: any | null = null;

export default async function handler(req: any, res: any) {
  try {
    if (!app) {
      const modulePath = process.env.NODE_ENV === 'production'
        ? '../dist/app.js'
        : '../dist/app.js';
      const mod = await import(modulePath as string);
      const createApp = (mod as any).createApp || (mod as any).default;
      app = createApp();
    }
    return app(req, res);
  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


