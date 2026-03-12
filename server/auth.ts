import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Express, Request, Response, NextFunction } from "express";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    adminId?: number;
  }
}
import { pool } from "./db";

export function setupAuth(app: Express) {
  // Trust the Vercel reverse proxy for HTTPS termination
  app.set('trust proxy', 1);

  console.log("setupAuth: process.env.DATABASE_URL is", process.env.DATABASE_URL ? "defined" : "undefined");

  let sessionStore;
  try {
    sessionStore = process.env.DATABASE_URL
      ? new PgSession({
        pool,
        createTableIfMissing: true,
        tableName: 'session',
        // Disable prune interval for serverless to prevent background activity
        pruneSessionInterval: false,
        // Suppress advisory lock issues if using Supabase transaction pooler on Vercel
        errorLog: console.error
      })
      : undefined;
  } catch (err) {
    console.error("Failed to initialize session store:", err);
  }

  console.log("setupAuth: sessionStore is", sessionStore ? "created" : "undefined");

  if (sessionStore) {
    sessionStore.on('error', (err: any) => {
      console.error('Session store error:', err);
    });
  }

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "opinion-insights-secret-key-change-me",
      resave: false,
      saveUninitialized: false,
      rolling: true, // Refresh session expiration on every request
      cookie: {
        httpOnly: true,
        // Must be true in Vercel production
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax",
      },
    })
  );
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
