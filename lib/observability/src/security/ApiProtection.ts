import type { AuthPrincipal, ThreatEvent } from "./types.js";
import { RateLimiter, type RateLimitConfig } from "./RateLimiter.js";
import { ThreatDetector } from "./ThreatDetector.js";
import { RequestValidator } from "./RequestValidator.js";

export interface ProtectionInput {
  readonly source: string;
  readonly principal?: AuthPrincipal;
  readonly bodySize?: number;
  readonly body?: string;
  readonly path?: string;
  readonly headers?: Record<string, string>;
  readonly signature?: { secret: string; header: string; timestampMs?: number };
}
export interface ProtectionResult {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly threats: readonly ThreatEvent[];
  readonly retryAfterMs?: number;
}

export interface ApiProtectionConfig {
  readonly maxBodyBytes?: number;
  readonly rateLimit?: RateLimitConfig;
  readonly requireAuth?: boolean;
  readonly replayWindowMs?: number;
}

export class ApiProtection {
  private readonly limiter: RateLimiter | undefined;
  private readonly detector = new ThreatDetector();
  private readonly reqValidator = new RequestValidator();
  private readonly nonces = new Map<string, number>();
  constructor(private readonly cfg: ApiProtectionConfig = {}) {
    this.limiter = cfg.rateLimit ? new RateLimiter(cfg.rateLimit) : undefined;
  }
  guard(input: ProtectionInput): ProtectionResult {
    const threats: ThreatEvent[] = [];
    if (this.cfg.requireAuth && !input.principal) return { allowed: false, reason: "unauthenticated", threats };
    if (this.cfg.maxBodyBytes && (input.bodySize ?? 0) > this.cfg.maxBodyBytes) {
      const ev: ThreatEvent = { kind: "oversize", ts: Date.now(), source: input.source, message: "body too large", severity: "medium" };
      return { allowed: false, reason: "oversize", threats: [ev] };
    }
    if (this.limiter) {
      const d = this.limiter.check(input.source);
      if (!d.allowed) return { allowed: false, reason: "rate-limited", threats, retryAfterMs: d.retryAfterMs };
    }
    if (input.signature && input.body) {
      const v = this.reqValidator.verify({ body: input.body, signature: input.signature.header, secret: input.signature.secret, timestampMs: input.signature.timestampMs });
      if (!v.valid) {
        const ev: ThreatEvent = { kind: "invalid-signature", ts: Date.now(), source: input.source, message: v.reason ?? "bad signature", severity: "high" };
        return { allowed: false, reason: "signature", threats: [ev] };
      }
      // replay
      const nonce = `${input.source}:${input.signature.header}`;
      const now = Date.now();
      const win = this.cfg.replayWindowMs ?? 5 * 60_000;
      for (const [k, t] of this.nonces) if (now - t > win) this.nonces.delete(k);
      if (this.nonces.has(nonce)) {
        const ev: ThreatEvent = { kind: "replay", ts: now, source: input.source, message: "replayed signature", severity: "high" };
        return { allowed: false, reason: "replay", threats: [ev] };
      }
      this.nonces.set(nonce, now);
    }
    threats.push(...this.detector.inspect({ source: input.source, path: input.path, body: input.body, headers: input.headers }));
    const bad = threats.find(t => t.severity === "high" || t.severity === "critical");
    if (bad) return { allowed: false, reason: bad.kind, threats };
    return { allowed: true, threats };
  }
}
