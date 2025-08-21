import express from "express";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";

dotenv.config();

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));

  if (process.env.NODE_ENV === 'production') {
    (app as any).set('trust proxy', 1);
  }

  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'your-secret-key-here'],
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }));

  // Register routes without WebSocket server in serverless
  void registerRoutes(app);

  return app;
}

export default createApp;


