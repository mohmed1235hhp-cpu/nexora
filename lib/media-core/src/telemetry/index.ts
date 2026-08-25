/**
 * TelemetryReport — every AIRouter run emits one structured report so
 * downstream systems (DB, Sentry, OTel exporter) can persist it uniformly.
 */

export interface AttemptRecord {
  adapterId: string;
  provider: string;
  model?: string;
  startedAt: string;
  endedAt: string;
  latencyMs: number;
  ok: boolean;
  error?: { name: string; message: string; retryable: boolean };
  tokens?: { input?: number; output?: number };
  costUsd?: number;
}

export interface TelemetryReport {
  runId: string;
  requestId: string;
  kind: string;
  qualityProfile: "quality-first" | "cost-first" | "balanced";
  totalLatencyMs: number;
  totalCostUsd: number;
  attempts: AttemptRecord[];
  finalAdapterId: string | null;
  outcome: "success" | "failure" | "cancelled";
  qualityReview?: {
    reviewer: string;
    score: number;
    notes?: string;
  };
}

export function emptyReport(runId: string, requestId: string, kind: string): TelemetryReport {
  return {
    runId,
    requestId,
    kind,
    qualityProfile: "quality-first",
    totalLatencyMs: 0,
    totalCostUsd: 0,
    attempts: [],
    finalAdapterId: null,
    outcome: "failure",
  };
}
