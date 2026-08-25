/**
 * Double-submit CSRF for httpOnly cookie sessions.
 * Skips safe methods (GET/HEAD/OPTIONS) and Bearer-token requests.
 */
import type { Request, Response, NextFunction } from "express";
import { randomBytes } from "node:crypto";
import { safeEqual } from "../lib/crypto.js";
import { SESSION_COOKIE_NAME } from "../lib/session-cookie.js";

const COOKIE = "csrf_token";
const HEADER = "x-csrf-token";
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export function issueCsrf(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies?.[COOKIE]) {
    const t = randomBytes(24).toString("base64url");
    res.cookie(COOKIE, t, { httpOnly: false, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/" });
  }
  next();
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (SAFE.has(req.method)) return next();
  if (req.headers.authorization?.startsWith("Bearer ")) return next(); // API/mobile clients
  // No cookie-based session in play (e.g. /auth/login, /auth/register before
  // any session exists) — nothing to forge a request against yet, so this
  // isn't a CSRF-protectable request. Once a session cookie exists, every
  // unsafe request must carry the matching CSRF header.
  if (!req.cookies?.[SESSION_COOKIE_NAME]) return next();
  const cookie = req.cookies?.[COOKIE];
  const header = req.header(HEADER);
  if (!cookie || !header || !safeEqual(cookie, header)) {
    return res.status(403).json({ error: "csrf_failed" });
  }
  next();
}
