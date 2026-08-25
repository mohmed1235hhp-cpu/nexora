import type { Timestamp, Tags } from "../core/types.js";
export type HealthState = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface HealthResult {
  readonly state:    HealthState;
  readonly message?: string;
  readonly data?:    Readonly<Record<string, number | string | boolean>>;
  readonly durationMs: number;
  readonly ts:       Timestamp;
}

export interface HealthCheck {
  readonly name: string;
  readonly critical?: boolean;
  readonly tags?: Tags;
  readonly timeoutMs?: number;
  run(): Promise<HealthResult> | HealthResult;
}

export interface HealthSnapshot {
  readonly state: HealthState;
  readonly ts:    Timestamp;
  readonly checks: Readonly<Record<string, HealthResult>>;
  readonly summary: { healthy: number; degraded: number; unhealthy: number; unknown: number };
}
