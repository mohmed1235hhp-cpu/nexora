import { Request, Response, NextFunction } from "express";
import { db, sessionsTable, usersTable, apiKeysTable } from "@workspace/db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { hashToken, readSessionCookie } from "../lib/session-cookie";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

// ADR 0002 (httpOnly cookie session migration), dual-accept phase: web clients
// send the session via the httpOnly "sid" cookie, while API/mobile (Expo)
// clients that can't rely on a shared cookie jar continue to send
// `Authorization: Bearer <token>`. Bearer takes precedence when both are
// present since an explicit header is the more deliberate signal.
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return readSessionCookie(req);
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.token, hashToken(token)), gt(sessionsTable.expiresAt, new Date())))
    .limit(1);

  let userId = session[0]?.userId;
  if (!userId && req.headers.authorization?.startsWith("Bearer ")) {
    const [apiKey] = await db.select().from(apiKeysTable)
      .where(and(eq(apiKeysTable.keyHash, hashToken(token)), isNull(apiKeysTable.revokedAt))).limit(1);
    if (apiKey) {
      userId = apiKey.userId;
      void db.update(apiKeysTable).set({ lastUsedAt: new Date() }).where(eq(apiKeysTable.id, apiKey.id));
    }
  }

  if (!userId) return res.status(401).json({ error: "Invalid or expired session/API key" });

  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user.length || user[0].isBanned) return res.status(401).json({ error: "User not found or banned" });

  req.userId = userId;
  req.userRole = user[0].role;
  return next();
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  const session = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.token, hashToken(token)), gt(sessionsTable.expiresAt, new Date())))
    .limit(1);

  if (session.length) {
    req.userId = session[0].userId;
  }
  return next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!["admin", "super_admin"].includes(req.userRole ?? "")) {
    return void res.status(403).json({ error: "Forbidden" });
  }
  return next();
}
