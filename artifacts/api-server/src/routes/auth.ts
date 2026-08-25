/**
 * Phase 1 — Authentication (v5 hardened)
 * - Zod validation via generic validate() middleware
 * - Argon2id password hashing (bcrypt legacy hashes auto-migrated on login)
 * - Structured audit events on register / login / logout / password change
 * - Timing-attack resistant even for missing users
 * - Errors thrown as AppError subclasses; handled centrally in app.ts
 */
import { Router, Request, Response } from "express";
import { db, usersTable, sessionsTable, privacySettingsTable, presenceTable, authTokensTable, referralsTable, userCreditsTable } from "@workspace/db";
import { eq, and, gt, or, sql } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import { asyncHandler, ConflictError, UnauthorizedError, ForbiddenError, NotFoundError, ErrorCode } from "@workspace/core/errors";
import { requireAuth, extractToken, type AuthRequest } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { authLimiter } from "../middlewares/rateLimit";
import { buildUserProfile } from "../lib/helpers";
import { hashPassword, verifyPassword } from "../lib/password";
import { hashToken, setSessionCookie, clearSessionCookie } from "../lib/session-cookie";
import { auditFromRequest } from "../lib/audit";
import { env } from "../lib/env";
import { sendTransactionalEmail } from "../lib/email";
import {
  RegisterSchema,
  LoginSchema,
  ChangePasswordSchema,
} from "../lib/schemas/auth";

const router = Router();

function tokenHash(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function sessionExpiry(): Date {
  return new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
}

function sessionTtlMs(): number {
  return env.SESSION_TTL_HOURS * 60 * 60 * 1000;
}

// A single well-formed Argon2 hash used to keep timing constant when the
// account does not exist. Generated once per process at boot.
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword(crypto.randomBytes(32).toString("hex"));
  }
  return dummyHashPromise;
}

// POST /api/auth/register
router.post(
  "/register",
  authLimiter,
  validate({ body: RegisterSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password, displayName, referralCode } = req.body;

    const [existingUsername, existingEmail] = await Promise.all([
      db.select({ id: usersTable.id }).from(usersTable)
        .where(eq(usersTable.username, username)).limit(1),
      db.select({ id: usersTable.id }).from(usersTable)
        .where(eq(usersTable.email, email)).limit(1),
    ]);

    if (existingUsername.length) {
      throw new ConflictError("Username already taken", { code: ErrorCode.USERNAME_TAKEN });
    }
    if (existingEmail.length) {
      throw new ConflictError("Email already registered", { code: ErrorCode.EMAIL_TAKEN });
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db.insert(usersTable).values({
      username,
      email,
      passwordHash,
      displayName,
    }).returning();

    if (referralCode) {
      const [ref] = await db.select().from(referralsTable).where(eq(referralsTable.code, referralCode.toUpperCase())).limit(1);
      if (ref && ref.status === "pending" && ref.inviterId !== user.id) {
        await db.transaction(async (tx) => {
          // Atomically claim the referral during registration so concurrent
          // registrations cannot award the same referral twice.
          const [claimed] = await tx.update(referralsTable)
            .set({ inviteeId: user.id, status: "completed", completedAt: new Date() })
            .where(and(eq(referralsTable.id, ref.id), eq(referralsTable.status, "pending")))
            .returning();

          if (!claimed) return;

          for (const [uid, amount] of [[ref.inviterId, ref.inviterReward], [user.id, ref.inviteeReward]] as const) {
            await tx.insert(userCreditsTable)
              .values({ userId: uid, balance: amount })
              .onConflictDoUpdate({
                target: userCreditsTable.userId,
                set: { balance: sql`${userCreditsTable.balance} + ${amount}` },
              });
          }
        });
      }
    }

    await Promise.all([
      db.insert(privacySettingsTable).values({ userId: user.id }),
      db.insert(presenceTable).values({ userId: user.id, status: "offline" }),
    ]);

    // Email verification token. The token itself is never stored in plaintext.
    const verificationToken = generateToken();
    await db.insert(authTokensTable).values({
      userId: user.id, tokenHash: tokenHash(verificationToken),
      type: "email_verification", expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const publicBase = process.env.PUBLIC_APP_URL || "http://localhost:5173";
    await sendTransactionalEmail({
      to: user.email,
      subject: "Verify your NEXORA account",
      html: `<p>Welcome to NEXORA.</p><p><a href="${publicBase}/verify-email?token=${verificationToken}">Verify your email</a></p>`,
    });

    const token = generateToken();
    await db.insert(sessionsTable).values({
      // SECURITY: store only the SHA-256 hash, never the raw bearer token —
      // a DB leak/backup exposure previously handed over live sessions directly.
      userId: user.id, token: hashToken(token), expiresAt: sessionExpiry(),
    });

    auditFromRequest(req, "auth.register", { actorId: user.id });

    // ADR 0002: deliver the session as an httpOnly cookie for web clients;
    // the token is also returned in the body for Bearer-based (Expo) clients.
    setSessionCookie(res, token, sessionTtlMs());

    const profile = await buildUserProfile(user);
    res.status(201).json({ user: profile, token });
  }),
);

// POST /api/auth/login
router.post(
  "/login",
  authLimiter,
  validate({ body: LoginSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const identifier = email.toLowerCase().trim();

    const users = await db.select().from(usersTable)
      .where(or(eq(usersTable.email, identifier), eq(usersTable.username, identifier)))
      .limit(1);

    // Always run verifyPassword to keep timing constant even when the
    // account does not exist.
    const hash = users.length ? users[0].passwordHash : await getDummyHash();
    const { valid, needsRehash } = await verifyPassword(password, hash);

    if (!users.length || !valid) {
      auditFromRequest(req, "auth.login_failed", { meta: { identifier } });
      throw new UnauthorizedError("Invalid credentials", { code: ErrorCode.INVALID_CREDENTIALS });
    }

    const user = users[0];
    if (user.isBanned) {
      auditFromRequest(req, "auth.login_failed", {
        actorId: user.id, meta: { reason: "banned" },
      });
      throw new ForbiddenError("Account banned", { code: ErrorCode.ACCOUNT_BANNED });
    }

    // Transparent Argon2 migration for legacy bcrypt hashes.
    if (needsRehash) {
      const newHash = await hashPassword(password);
      await db.update(usersTable).set({ passwordHash: newHash })
        .where(eq(usersTable.id, user.id));
    }

    const token = generateToken();
    await Promise.all([
      db.insert(sessionsTable).values({
        userId: user.id, token: hashToken(token), expiresAt: sessionExpiry(),
      }),
      db.insert(presenceTable)
        .values({ userId: user.id, status: "online" })
        .onConflictDoUpdate({
          target: presenceTable.userId,
          set: { status: "online" },
        }),
    ]);

    auditFromRequest(req, "auth.login", { actorId: user.id });

    setSessionCookie(res, token, sessionTtlMs());

    const profile = await buildUserProfile(user);
    res.json({ user: profile, token });
  }),
);

// POST /api/auth/logout
router.post("/logout", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = extractToken(req);

  await Promise.all([
    token
      ? db.delete(sessionsTable).where(eq(sessionsTable.token, hashToken(token)))
      : Promise.resolve(),
    req.userId
      ? db.insert(presenceTable)
          .values({ userId: req.userId, status: "offline", lastSeen: new Date() })
          .onConflictDoUpdate({
            target: presenceTable.userId,
            set: { status: "offline", lastSeen: new Date() },
          })
      : Promise.resolve(),
  ]);

  clearSessionCookie(res);
  auditFromRequest(req, "auth.logout", { actorId: req.userId ?? null });
  res.status(204).end();
}));

// GET /api/auth/me
router.get("/me", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!users.length) {
    throw new NotFoundError("User not found");
  }
  const profile = await buildUserProfile(users[0]);
  res.json(profile);
}));

// POST /api/auth/change-password
router.post(
  "/change-password",
  requireAuth,
  authLimiter,
  validate({ body: ChangePasswordSchema }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const users = await db.select().from(usersTable)
      .where(eq(usersTable.id, req.userId!)).limit(1);
    if (!users.length) {
      throw new NotFoundError("User not found");
    }

    const { valid } = await verifyPassword(currentPassword, users[0].passwordHash);
    if (!valid) {
      auditFromRequest(req, "auth.login_failed", {
        actorId: req.userId, meta: { reason: "wrong_current_password" },
      });
      throw new UnauthorizedError("Current password is incorrect", {
        code: ErrorCode.INVALID_CURRENT_PASSWORD,
      });
    }

    const newHash = await hashPassword(newPassword);
    await db.update(usersTable).set({ passwordHash: newHash })
      .where(eq(usersTable.id, req.userId!));

    // Invalidate all other sessions for this user (keep current session).
    const currentToken = extractToken(req);
    await db.delete(sessionsTable)
      .where(and(
        eq(sessionsTable.userId, req.userId!),
        gt(sessionsTable.expiresAt, new Date()),
      ));
    // Recreate current session so the user stays logged in.
    const newToken = currentToken || generateToken();
    await db.insert(sessionsTable).values({
      userId: req.userId!,
      token: hashToken(newToken),
      expiresAt: sessionExpiry(),
    });
    setSessionCookie(res, newToken, sessionTtlMs());

    auditFromRequest(req, "auth.password_change", { actorId: req.userId });
    res.status(204).end();
  }),
);


// POST /api/auth/verify-email
router.post("/verify-email", authLimiter, validate({ body: z.object({ token: z.string().min(20).max(200) }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const [row] = await db.select().from(authTokensTable)
      .where(and(eq(authTokensTable.tokenHash, tokenHash(req.body.token)), eq(authTokensTable.type, "email_verification"))).limit(1);
    if (!row || row.usedAt || row.expiresAt < new Date()) throw new UnauthorizedError("Verification link is invalid or expired");
    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({ isVerified: true }).where(eq(usersTable.id, row.userId));
      await tx.update(authTokensTable).set({ usedAt: new Date() }).where(eq(authTokensTable.id, row.id));
    });
    auditFromRequest(req, "auth.email_verified", { actorId: row.userId });
    res.json({ verified: true });
  }));

router.post("/forgot-password", authLimiter, validate({ body: z.object({ email: z.string().email().max(255) }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, req.body.email.toLowerCase())).limit(1);
    // Always return the same response to prevent account enumeration.
    if (user) {
      const token = generateToken();
      await db.insert(authTokensTable).values({
        userId: user.id, tokenHash: tokenHash(token), type: "password_reset",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });
      const base = process.env.PUBLIC_APP_URL || "http://localhost:5173";
      await sendTransactionalEmail({
        to: user.email, subject: "Reset your NEXORA password",
        html: `<p><a href="${base}/reset-password?token=${token}">Reset password</a></p>`,
      });
    }
    res.json({ message: "If the account exists, a reset link has been sent." });
  }));

router.post("/reset-password", authLimiter,
  validate({ body: z.object({ token: z.string().min(20).max(200), newPassword: z.string().min(8).max(200).regex(/[A-Z]/).regex(/[0-9]/) }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const [row] = await db.select().from(authTokensTable)
      .where(and(eq(authTokensTable.tokenHash, tokenHash(req.body.token)), eq(authTokensTable.type, "password_reset"))).limit(1);
    if (!row || row.usedAt || row.expiresAt < new Date()) throw new UnauthorizedError("Reset link is invalid or expired");
    const passwordHash = await hashPassword(req.body.newPassword);
    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, row.userId));
      await tx.update(authTokensTable).set({ usedAt: new Date() }).where(eq(authTokensTable.id, row.id));
      await tx.delete(sessionsTable).where(eq(sessionsTable.userId, row.userId));
    });
    auditFromRequest(req, "auth.password_reset", { actorId: row.userId });
    res.json({ reset: true });
  }));

export default router;
