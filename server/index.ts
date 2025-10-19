import express, { type Request, Response, NextFunction } from "express";
import cookieSession from "cookie-session";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { registerRoutes } from "./routes";
import { setupInitialData } from "./setup-database";
import { migrateStudentsToUsers } from "./migrate-students";
import { createTablesIfNotExist } from "./create-tables";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create database tables if they don't exist
  await createTablesIfNotExist();
  
  // Setup initial database data
  await setupInitialData();
  
  // Migrate existing students to have user records
  await migrateStudentsToUsers();
  


  // Trust proxy for secure cookies in production
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Setup cookie-session for portability across environments/serverless
  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'your-secret-key-here'],
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }));

  // Setup routes
  const server = createServer(app);
  await registerRoutes(app, server);

  // Protect SPA routes at the server level as well (defense-in-depth)
  // Unauthenticated users typing /admin or /student URLs will be redirected to the landing page
  const requireAdminPage = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).session?.user;
    if (!user) {
      return res.redirect(302, '/');
    }
    if (user.role !== 'admin') {
      return res.redirect(302, '/');
    }
    return next();
  };
  const requireStudentPage = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).session?.user;
    if (!user) {
      return res.redirect(302, '/');
    }
    if (user.role !== 'student') {
      return res.redirect(302, '/');
    }
    return next();
  };

  // Admin-only pages
  app.get([
    '/admin',
    '/exams',
    '/exams/*',
    '/students',
    '/results',
    '/email-management',
    '/profile'
  ], requireAdminPage);

  // Student-only pages
  app.get([
    '/student',
    '/student/*'
  ], requireStudentPage);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    // Log error but don't throw after response is sent
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on port 5000 (Replit) or PORT env if provided
  const port = Number(process.env.PORT || 5000);
  server.listen({
    port,
    host: "localhost",
    // reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
