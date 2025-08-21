// Lazy initialize the Express app to reuse between invocations
let app: any | null = null;

export default async function handler(req: any, res: any) {
  try {
    if (!app) {
      const mod: any = await import('../dist/app.cjs');
      const createApp = mod.createApp || mod.default?.createApp || (typeof mod.default === 'function' ? mod.default : null);
      if (!createApp) throw new Error('Failed to load createApp from dist/app.cjs');
      app = createApp();
    }
    return app(req, res);
  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


