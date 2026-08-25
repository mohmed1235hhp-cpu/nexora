/**
 * Phase 8 — Unified Pipeline.
 *
 * Connects AI Router → Multi-Agent orchestrator → Worker Pool →
 * Build/Deploy → Hosting/Server-Manager into a single, monitored flow.
 *
 * Design goals:
 *  - Zero coupling to specific agent / router / worker implementations
 *    (all injected through ports).
 *  - Every step publishes to the MonitoringBus so the SSE dashboard
 *    shows real-time progress.
 *  - Parallel generation supported via the injected queue + worker pool:
 *    each pipeline step can either execute inline or be dispatched as
 *    a queue job that any worker can pick up.
 *  - Failure of one step does not corrupt the pipeline: results carry
 *    `ok/error` and downstream steps observe them.
 */
import type { MonitoringBus } from '../monitoring/MonitoringBus.js';

export interface AIRouterPort {
  /** Route a task to the best AI provider and return a plan (steps to run). */
  plan(input: { goal: string; context?: unknown }): Promise<{ steps: readonly PlannedStep[] }>;
}

export interface AgentPort {
  readonly id: string;
  readonly capabilities: readonly string[];
  execute(input: { step: PlannedStep; context: PipelineContext }): Promise<StepResult>;
}

export interface WorkerPort {
  run<I, O>(task: { id: string; kind: string; input: I; timeoutMs?: number }): Promise<{ ok: boolean; output?: O; error?: string }>;
}

export interface QueuePort<T> {
  enqueueAsync?(payload: T, opts?: { priority?: number; notBefore?: number }): Promise<{ id: string }>;
  enqueue(payload: T, opts?: { priority?: number; notBefore?: number }): { id: string };
}

export interface PlannedStep {
  readonly id: string;
  readonly kind: string;       // matches an AgentPort capability or a WorkerPool handler kind
  readonly input: unknown;
  readonly parallelGroup?: string;
  readonly priority?: number;
  readonly dependsOn?: readonly string[];
}

export interface StepResult {
  readonly stepId: string;
  readonly ok: boolean;
  readonly output?: unknown;
  readonly error?: string;
  readonly durationMs: number;
}

export interface PipelineContext {
  readonly runId: string;
  readonly startedAt: number;
  readonly results: Map<string, StepResult>;
  readonly meta: Record<string, unknown>;
}

export interface UnifiedPipelineOptions {
  readonly router: AIRouterPort;
  readonly agents: readonly AgentPort[];
  readonly worker?: WorkerPort;
  readonly queue?: QueuePort<PlannedStep>;
  readonly monitoring?: MonitoringBus;
  readonly maxParallel?: number;
}

export class UnifiedPipeline {
  private readonly opts: UnifiedPipelineOptions;
  private readonly agentIndex = new Map<string, AgentPort>();

  constructor(opts: UnifiedPipelineOptions) {
    this.opts = opts;
    for (const a of opts.agents) for (const cap of a.capabilities) this.agentIndex.set(cap, a);
  }

  async execute(input: { goal: string; context?: unknown }): Promise<PipelineContext> {
    const ctx: PipelineContext = {
      runId: `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      startedAt: Date.now(),
      results: new Map(),
      meta: {},
    };
    this.emit('pipeline.step', ctx.runId, { step: 'plan.start', goal: input.goal });

    const plan = await this.opts.router.plan(input);
    this.emit('pipeline.step', ctx.runId, { step: 'plan.done', stepCount: plan.steps.length });

    // Group by dependency layers so independent steps can run in parallel.
    const layers = topoLayers(plan.steps);
    const maxParallel = this.opts.maxParallel ?? 8;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i]!;
      this.emit('pipeline.step', ctx.runId, { step: 'layer.start', layer: i, steps: layer.length });
      await runWithConcurrency(layer, maxParallel, async (step) => {
        const t0 = Date.now();
        this.emit('pipeline.step', ctx.runId, { step: 'step.start', stepId: step.id, kind: step.kind });
        try {
          const result = await this.runStep(step, ctx);
          ctx.results.set(step.id, result);
          this.emit('pipeline.step', ctx.runId, {
            step: 'step.done', stepId: step.id, ok: result.ok, durationMs: result.durationMs,
          });
        } catch (err: unknown) {
          const failure: StepResult = {
            stepId: step.id, ok: false,
            error: err instanceof Error ? err.message : String(err),
            durationMs: Date.now() - t0,
          };
          ctx.results.set(step.id, failure);
          this.emit('pipeline.step', ctx.runId, { step: 'step.error', stepId: step.id, error: failure.error });
        }
      });
      this.emit('pipeline.step', ctx.runId, { step: 'layer.done', layer: i });
    }

    this.emit('pipeline.step', ctx.runId, {
      step: 'pipeline.done',
      totalMs: Date.now() - ctx.startedAt,
      ok: Array.from(ctx.results.values()).every(r => r.ok),
    });
    return ctx;
  }

  private async runStep(step: PlannedStep, ctx: PipelineContext): Promise<StepResult> {
    const t0 = Date.now();
    // 1) Prefer an agent that declares this capability.
    const agent = this.agentIndex.get(step.kind);
    if (agent) {
      const res = await agent.execute({ step, context: ctx });
      return { ...res, durationMs: Date.now() - t0 };
    }
    // 2) Otherwise dispatch to worker pool if wired.
    if (this.opts.worker) {
      const res = await this.opts.worker.run<unknown, unknown>({
        id: step.id, kind: step.kind, input: step.input,
      });
      return { stepId: step.id, ok: res.ok, output: res.output, error: res.error, durationMs: Date.now() - t0 };
    }
    // 3) Or fall back to durable queue and mark step as scheduled.
    if (this.opts.queue) {
      const q = this.opts.queue;
      const enqueue = q.enqueueAsync ? q.enqueueAsync.bind(q) : async (p: PlannedStep, o?: { priority?: number }) => q.enqueue(p, o);
      const { id } = await enqueue(step, { priority: step.priority });
      return { stepId: step.id, ok: true, output: { queued: id }, durationMs: Date.now() - t0 };
    }
    return { stepId: step.id, ok: false, error: `no executor for kind ${step.kind}`, durationMs: Date.now() - t0 };
  }

  private emit(kind: Parameters<MonitoringBus['publish']>[0], source: string, payload: unknown): void {
    this.opts.monitoring?.publish(kind, source, payload);
  }
}

/** Topological layering: each returned layer's steps have no cross-layer deps. */
function topoLayers(steps: readonly PlannedStep[]): PlannedStep[][] {
  const remaining = new Map<string, PlannedStep>();
  for (const s of steps) remaining.set(s.id, s);
  const done = new Set<string>();
  const out: PlannedStep[][] = [];
  while (remaining.size > 0) {
    const layer: PlannedStep[] = [];
    for (const s of remaining.values()) {
      const deps = s.dependsOn ?? [];
      if (deps.every(d => done.has(d))) layer.push(s);
    }
    if (layer.length === 0) {
      // dependency cycle or unknown dep — emit rest as a final layer to avoid deadlock
      out.push(Array.from(remaining.values()));
      break;
    }
    for (const s of layer) { done.add(s.id); remaining.delete(s.id); }
    out.push(layer);
  }
  return out;
}

async function runWithConcurrency<T>(items: readonly T[], limit: number, fn: (t: T) => Promise<void>): Promise<void> {
  const pool: Promise<void>[] = [];
  for (const it of items) {
    const p = fn(it).then(() => { void pool.splice(pool.indexOf(p), 1); });
    pool.push(p);
    if (pool.length >= limit) await Promise.race(pool);
  }
  await Promise.all(pool);
}
