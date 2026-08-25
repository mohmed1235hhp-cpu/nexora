import type { Response, Request } from "express";
import { sha256Hex } from "./crypto.js";

export const SESSION_COOKIE_NAME = "sid";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days — fallback only; callers should pass an explicit maxAgeMs tied to the session's actual expiry.

export function setSessionCookie(res: Response, token: string, maxAgeMs: number = MAX_AGE * 1000) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeMs,
  });
}
export function clearSessionCookie(res: Response) { res.clearCookie(SESSION_COOKIE_NAME, { path: "/" }); }
export function readSessionCookie(req: Request): string | null { return req.cookies?.[SESSION_COOKIE_NAME] ?? null; }
/** Store SHA-256(token) in DB; compare hashes on lookup. */
export function hashToken(token: string) { return sha256Hex(token); }
