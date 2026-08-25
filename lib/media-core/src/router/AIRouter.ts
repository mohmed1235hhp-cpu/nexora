import { randomUUID } from "crypto";
import type {
  AdapterContext,
  IMediaAdapter,
} from "../interfaces/IMediaAdapter.js";
import { emptyReport, type AttemptRecord, type TelemetryReport } from "../telemetry/index.js";

export type QualityProfile = "quality-first" | "cost-first" | "balanced";

export interface RouterConfig {
  profile: QualityProfile;
  perAttemptTimeoutMs: number;
  totalBudgetMs: number;
  maxAttempts: number;
  /** Optional quality-review hook (LLM-as-judge). Returns score 0..1. */
  reviewer?: (kind: string, output: unknown) => Promise<{ score: number; notes?: string }>;
}

export const defaultRouterConfig: RouterConfig = {
  profile: "quality-first",
  perAttemptTimeoutMs: 60_000,
  totalBudgetMs: 180_000,
  maxAttempts: 3,
};

/**
 * AIRouter — orders adapters by quality profile, retries with exponential
 * backoff, and honors a total budget. Emits a full TelemetryReport for
 * every run so history / observability layers get a uniform shape.
 */
export class AIRouter<Input, Output> {
  constructor(
    private readonly adapters: ReadonlyArray<IMediaAdapter<Input, Output>>,
    private readonly config: RouterConfig = defaultRouterConfig,
  ) {
    if (adapters.length === 0) throw new Error("AIRouter needs at least one adapter");
  }

  private orderAdapters(): ReadonlyArray<IMediaAdapter<Input, Output>> {
    const rank = (tier: string) =>
      this.config.profile === "quality-first"
        ? tier === "flagship" ? 0 : tier === "balanced" ? 1 : 2
        : this.config.profile === "cost-first"
          ? tier === "cheap" ? 0 : tier === "balanced" ? 1 : 2
          : tier === "balanced" ? 0 : tier === "flagship" ? 1 : 2;
    return [...this.adapters].sort((a, b) => rank(a.meta.qualityTier) - rank(b.meta.qualityTier));
  }

  async run(
    input: Input,
    ctx: AdapterContext,
    kind: string,
  ): Promise<{ output: Output | null; report: TelemetryReport }> {
    const runId = randomUUID();
    const report = emptyReport(runId, ctx.requestId, kind);
    report.qualityProfile = this.config.profile;

    const start = Date.now();
    const ordered = this.orderAdapters().slice(0, this.config.maxAttempts);
    let output: Output | null = null;

    for (const adapter of ordered) {
      if (Date.now() - start > this.config.totalBudgetMs) break;

      const attemptStart = Date.now();
      const record: AttemptRecord = {
        adapterId: adapter.meta.id,
        provider: adapter.meta.provider,
        startedAt: new Date(attemptStart).toISOString(),
        endedAt: "",
        latencyMs: 0,
        ok: false,
      };

      try {
        output = await withTimeout(
          adapter.execute(input, ctx),
          this.config.perAttemptTimeoutMs,
          `adapter ${adapter.meta.id} timed out`,
        );
        record.ok = true;
        report.finalAdapterId = adapter.meta.id;
      } catch (err) {
        const e = err as Error;
        record.error = {
          name: e.name,
          message: e.message,
          retryable: !/abort|invalid|forbidden|unauthorized/i.test(e.message),
        };
      } finally {
        record.endedAt = new Date().toISOString();
        record.latencyMs = Date.now() - attemptStart;
        report.attempts.push(record);
      }

      if (output) break;
      await backoff(report.attempts.length);
    }

    report.totalLatencyMs = Date.now() - start;
    report.outcome = output ? "success" : "failure";

    if (output && this.config.reviewer) {
      try {
        const review = await this.config.reviewer(kind, output);
        report.qualityReview = { reviewer: "llm-judge", ...review };
      } catch {
        // reviewer failures never break the primary result
      }
    }

    return { output, report };
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(msg)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
  });
}

function backoff(attempt: number): Promise<void> {
  const ms = Math.min(1000 * 2 ** (attempt - 1), 8000);
  return new Promise((r) => setTimeout(r, ms));
}
