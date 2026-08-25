import type { RecoveryContext, RecoveryResult, RecoveryStrategy } from "./types.js";

async function timed(name: string, fn: () => Promise<{ outcome: RecoveryResult["outcome"]; message?: string }>): Promise<RecoveryResult> {
  const t0 = Date.now();
  try { const r = await fn(); return { strategy: name, outcome: r.outcome, message: r.message, ts: Date.now(), durationMs: Date.now() - t0 }; }
  catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); return { strategy: name, outcome: "failed", message: msg, ts: Date.now(), durationMs: Date.now() - t0 }; }
}

export interface WorkerHandle { readonly id: string; restart(): Promise<void>; isAlive(): boolean; }
export class RestartFailedWorker implements RecoveryStrategy {
  readonly name = "restart-failed-worker";
  constructor(private readonly workers: () => readonly WorkerHandle[]) {}
  canHandle(ctx: RecoveryContext) { return ctx.reason === "worker-failed" || ctx.reason === "worker-dead"; }
  run(ctx: RecoveryContext) {
    return timed(this.name, async () => {
      const dead = this.workers().filter(w => !w.isAlive() && (!ctx.target || w.id === ctx.target));
      for (const w of dead) await w.restart();
      return { outcome: dead.length ? "recovered" : "skipped", message: `restarted=${dead.length}` };
    });
  }
}

export interface RetryableTask { readonly id: string; retry(): Promise<void>; readonly failed: boolean; }
export class RetryFailedTasks implements RecoveryStrategy {
  readonly name = "retry-failed-tasks";
  constructor(private readonly tasks: () => readonly RetryableTask[], private readonly maxAttempts = 3) {}
  canHandle(ctx: RecoveryContext) { return ctx.reason === "tasks-failed" && ctx.attempt <= this.maxAttempts; }
  run() {
    return timed(this.name, async () => {
      const failed = this.tasks().filter(t => t.failed);
      for (const t of failed) await t.retry();
      return { outcome: failed.length ? "recovered" : "skipped", message: `retried=${failed.length}` };
    });
  }
}

export interface ClearableQueue { readonly name: string; clear(): Promise<number>; }
export class ClearQueue implements RecoveryStrategy {
  readonly name = "clear-queue";
  constructor(private readonly queue: () => ClearableQueue) {}
  canHandle(ctx: RecoveryContext) { return ctx.reason === "queue-poisoned" || ctx.reason === "queue-overflow"; }
  run() {
    return timed(this.name, async () => {
      const dropped = await this.queue().clear();
      return { outcome: "recovered", message: `dropped=${dropped}` };
    });
  }
}

export interface RecoverableService { readonly name: string; recover(): Promise<boolean>; }
export class RecoverServices implements RecoveryStrategy {
  readonly name = "recover-services";
  constructor(private readonly services: () => readonly RecoverableService[]) {}
  canHandle(ctx: RecoveryContext) { return ctx.reason === "service-degraded" || ctx.reason === "service-unhealthy"; }
  run() {
    return timed(this.name, async () => {
      let ok = 0, ko = 0;
      for (const s of this.services()) { try { const r = await s.recover(); r ? ok++ : ko++; } catch { ko++; } }
      return { outcome: ok > 0 ? "recovered" : "failed", message: `recovered=${ok} failed=${ko}` };
    });
  }
}
