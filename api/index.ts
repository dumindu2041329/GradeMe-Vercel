// Lazy initialize the Express app to reuse between invocations
let app: any | null = null;

export default async function handler(req: any, res: any) {
  try {
    if (!app) {
      // Load bundled CJS file using require to avoid ESM dynamic require issues inside deps
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('../dist/app.cjs');
      const createApp = (mod as any).createApp || (mod as any).default;
      app = createApp();
    }
    return app(req, res);
  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


