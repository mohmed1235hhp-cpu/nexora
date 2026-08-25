/**
 * @workspace/scalability — cross-cutting helpers for 1M-user readiness.
 *
 * Included:
 *   - rateLimit(identity, action, { limit, windowSec }) → boolean allowed?
 *   - idempotent(key, scope, ttlSec, work) → memoized write result
 *   - withTimeout(promise, ms) → hard timeout wrapper
 *   - retry(fn, { attempts, baseMs, jitter }) → exponential backoff w/ jitter
 *   - hashToken(raw) / verifyToken(raw, hash) → SHA-256 hex tokens for storage
 *
 * All helpers are stateless where possible; stateful ones (rate-limit,
 * idempotency) go through the @workspace/cache abstraction — Redis in prod,
 * in-memory in dev.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getCache, nsKey } from "@workspace/cache";

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
export interface RateLimitOptions {
  limit: number;
  windowSec: number;
}
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSec: number;
}

export async function rateLimit(
  identity: string,
  action: string,
  { limit, windowSec }: RateLimitOptions,
): Promise<RateLimitResult> {
  const cache = await getCache();
  const key = nsKey("rl", action, identity, String(Math.floor(Date.now() / (windowSec * 1000))));
  const n = await cache.incrWithTtl(key, windowSec);
  return {
    allowed:   n <= limit,
    remaining: Math.max(0, limit - n),
    resetInSec: windowSec - Math.floor((Date.now() / 1000) % windowSec),
  };
}

// ---------------------------------------------------------------------------
// Idempotency (write-once)
// ---------------------------------------------------------------------------
export async function idempotent<T>(
  key: string,
  scope: string,
  ttlSec: number,
  work: () => Promise<T>,
): Promise<T> {
  const cache = await getCache();
  const cacheKey = nsKey("idem", scope, key);
  const cached = await cache.get<T>(cacheKey);
  if (cached !== null) return cached;
  const result = await work();
  await cache.set(cacheKey, result, ttlSec);
  return result;
}

// ---------------------------------------------------------------------------
// Timeouts + retries
// ---------------------------------------------------------------------------
export async function withTimeout<T>(promise: Promise<T>, ms: number, label = "operation"): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return await Promise.race([
    promise.finally(() => clearTimeout(timer!)),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms);
    }),
  ]);
}

export interface RetryOptions {
  attempts?: number;
  baseMs?:   number;
  maxMs?:    number;
  jitter?:   boolean;
  onRetry?:  (err: unknown, attempt: number) => void;
}
export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseMs   = opts.baseMs   ?? 250;
  const maxMs    = opts.maxMs    ?? 10_000;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (err) {
      lastErr = err;
      opts.onRetry?.(err, i + 1);
      if (i === attempts - 1) break;
      const backoff = Math.min(maxMs, baseMs * 2 ** i);
      const wait    = opts.jitter === false ? backoff : Math.random() * backoff;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// Token hashing (never store raw session tokens or API keys)
// ---------------------------------------------------------------------------
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
export function verifyToken(raw: string, hash: string): boolean {
  const a = Buffer.from(hashToken(raw), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
