import type { Timestamp, Tags } from "../core/types.js";

export type Permission = string; // e.g. "project:read"
export type Role = string;

export interface PermissionRule {
  readonly role: Role;
  readonly permissions: readonly Permission[];
}

export interface ResourceAcl {
  readonly resource: string;
  readonly ownerId?: string;
  readonly allow: Readonly<Record<Role, readonly Permission[]>>;
}

export interface AuthPrincipal {
  readonly id: string;
  readonly roles: readonly Role[];
  readonly tags?: Tags;
}

export type ThreatKind =
  | "rate-anomaly" | "brute-force" | "injection" | "replay"
  | "oversize" | "invalid-signature" | "forbidden";

export interface ThreatEvent {
  readonly kind: ThreatKind;
  readonly ts: Timestamp;
  readonly source: string; // ip / user id / api key hash
  readonly message: string;
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly data?: Readonly<Record<string, string | number | boolean>>;
}

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: Timestamp;
  readonly retryAfterMs?: number;
}

export interface SecretsProvider {
  readonly name: string;
  get(key: string): Promise<string | undefined> | string | undefined;
  has(key: string): Promise<boolean> | boolean;
  list?(): Promise<readonly string[]> | readonly string[];
}

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}
export interface ValidationResult<T> {
  readonly ok: boolean;
  readonly value?: T;
  readonly issues?: readonly ValidationIssue[];
}

/** Structural interface compatible with zod schemas (safeParse). */
export interface SchemaLike<T> {
  safeParse(input: unknown): { success: true; data: T } | { success: false; error: { issues: readonly { path: readonly (string|number)[]; message: string }[] } };
}
