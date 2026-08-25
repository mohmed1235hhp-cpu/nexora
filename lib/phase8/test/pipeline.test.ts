import { describe, it, expect } from 'vitest';
import { UnifiedPipeline, type PlannedStep, type AgentPort, type AIRouterPort } from '../src/pipeline/UnifiedPipeline.js';
import { MonitoringBus } from '../src/monitoring/MonitoringBus.js';

const router: AIRouterPort = {
  async plan() {
    const steps: PlannedStep[] = [
      { id: 's1', kind: 'analyze', input: { file: 'a.ts' } },
      { id: 's2', kind: 'analyze', input: { file: 'b.ts' } },
      { id: 's3', kind: 'summarize', input: {}, dependsOn: ['s1', 's2'] },
    ];
    return { steps };
  },
};

const analyzer: AgentPort = {
  id: 'analyzer',
  capabilities: ['analyze'],
  async execute({ step }) {
    return { stepId: step.id, ok: true, output: { analyzed: (step.input as { file: string }).file }, durationMs: 1 };
  },
};

const summarizer: AgentPort = {
  id: 'summarizer',
  capabilities: ['summarize'],
  async execute({ step, context }) {
    return { stepId: step.id, ok: true, output: { summary: context.results.size }, durationMs: 1 };
  },
};

describe('UnifiedPipeline', () => {
  it('runs a plan with parallel + dependent steps and publishes events', async () => {
    const bus = new MonitoringBus();
    const events: string[] = [];
    bus.subscribe(e => { events.push(String((e.payload as { step?: string }).step ?? '')); });

    const pipeline = new UnifiedPipeline({ router, agents: [analyzer, summarizer], monitoring: bus });
    const ctx = await pipeline.execute({ goal: 'test' });

    expect(ctx.results.size).toBe(3);
    for (const r of ctx.results.values()) expect(r.ok).toBe(true);
    expect(events).toContain('plan.done');
    expect(events).toContain('pipeline.done');
  });

  it('marks step failed when no agent/worker/queue handles the kind', async () => {
    const pipeline = new UnifiedPipeline({
      router: { async plan() { return { steps: [{ id: 'x', kind: 'missing', input: null }] }; } },
      agents: [],
    });
    const ctx = await pipeline.execute({ goal: 'no-op' });
    const r = ctx.results.get('x');
    expect(r?.ok).toBe(false);
    expect(r?.error).toMatch(/no executor/);
  });
});
