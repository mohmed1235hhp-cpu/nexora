/** Core primitives shared across observability sub-systems. */
export type Timestamp = number;
export type DurationMs = number;
export type Tags = Readonly<Record<string, string | number | boolean>>;
export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export interface Named { readonly name: string; }
export interface Described extends Named { readonly description?: string; }
export interface Disposable { dispose(): void | Promise<void>; }

export type Severity =
  | "debug" | "info" | "notice"
  | "warn"  | "error" | "critical" | "alert" | "emergency";

export const SEVERITY_ORDER: Record<Severity, number> = {
  debug: 10, info: 20, notice: 25, warn: 30,
  error: 40, critical: 50, alert: 60, emergency: 70,
};

export type ObservabilityDomain =
  | "app" | "ai" | "agents" | "website-builder" | "app-builder"
  | "media" | "deploy" | "queue" | "worker" | "provider" | "self";
