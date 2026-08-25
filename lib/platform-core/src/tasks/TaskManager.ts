/**
 * Task Manager — Phase 1.
 * Splits a user request (given an IntentAnalysis) into a DAG of tasks.
 * Emits an ExecutionPlan with parallel groups precomputed.
 *
 * Does NOT execute tasks. Sends them to AIOrchestrator only.
 */
import type { ExecutionPlan, IntentAnalysis, Task, UserRequest } from "../types";

export interface TaskTemplate {
  readonly capability: string;
  readonly name: string;
  readonly dependsOn?: readonly string[];
  readonly priority?: number;
  readonly retriable?: boolean;
  readonly timeoutMs?: number;
  build(req: UserRequest, intent: IntentAnalysis): unknown;
}

const T = (partial: TaskTemplate) => partial;

/**
 * Static blueprint per intent. Extend with new intents by adding an entry.
 */
export const INTENT_BLUEPRINTS: Record<string, readonly TaskTemplate[]> = {
  chat: [T({ capability: "chat.reply", name: "reply", build: (r) => ({ prompt: r.input }) })],
  search: [
    T({ capability: "search.web", name: "search", build: (r) => ({ query: r.input }) }),
    T({
      capability: "chat.reply",
      name: "answer",
      dependsOn: ["search"],
      build: (r) => ({ prompt: r.input, useCitations: true }),
    }),
  ],
  "image.generate": [
    T({ capability: "image.generate", name: "image", build: (r) => ({ prompt: r.input }) }),
    T({ capability: "chat.reply", name: "caption", dependsOn: ["image"], build: (r) => ({ prompt: r.input }) }),
  ],
  "image.analyze": [T({ capability: "image.analyze", name: "vision", build: (r) => ({ prompt: r.input, attachments: r.attachments }) })],
  voice: [T({ capability: "voice.synthesize", name: "voice", build: (r) => ({ text: r.input }) })],
  "code.generate": [
    T({ capability: "planning.plan", name: "plan", build: (r) => ({ goal: r.input }) }),
    T({ capability: "code.generate", name: "code", dependsOn: ["plan"], build: (r) => ({ spec: r.input }) }),
    T({ capability: "code.review", name: "review", dependsOn: ["code"], build: () => ({}) }),
    T({ capability: "code.test", name: "test", dependsOn: ["code"], build: () => ({}) }),
  ],
  "code.review": [T({ capability: "code.review", name: "review", build: (r) => ({ code: r.input }) })],
  "code.fix": [
    T({ capability: "debug.diagnose", name: "diagnose", build: (r) => ({ issue: r.input }) }),
    T({ capability: "code.generate", name: "patch", dependsOn: ["diagnose"], build: (r) => ({ spec: r.input }) }),
  ],
  "app.build": [
    T({ capability: "planning.plan", name: "plan", build: (r) => ({ goal: r.input }) }),
    T({ capability: "architecture.design", name: "arch", dependsOn: ["plan"], build: () => ({}) }),
    T({ capability: "image.generate", name: "images", dependsOn: ["arch"], build: (r) => ({ prompt: r.input }) }),
    T({ capability: "content.write", name: "content", dependsOn: ["arch"], build: (r) => ({ topic: r.input }) }),
    T({ capability: "code.generate", name: "code", dependsOn: ["images", "content"], build: (r) => ({ spec: r.input }) }),
    T({ capability: "code.test", name: "test", dependsOn: ["code"], build: () => ({}) }),
    T({ capability: "deploy.package", name: "package", dependsOn: ["test"], build: () => ({}) }),
    T({ capability: "deploy.deliver", name: "delivery", dependsOn: ["package"], build: () => ({}) }),
  ],
  "website.build": [
    T({ capability: "planning.plan", name: "plan", build: (r) => ({ goal: r.input }) }),
    T({ capability: "design.ui", name: "design", dependsOn: ["plan"], build: () => ({}) }),
    T({ capability: "image.generate", name: "images", dependsOn: ["design"], build: (r) => ({ prompt: r.input }) }),
    T({ capability: "content.write", name: "content", dependsOn: ["design"], build: (r) => ({ topic: r.input }) }),
    T({ capability: "code.generate", name: "code", dependsOn: ["images", "content"], build: (r) => ({ spec: r.input }) }),
    T({ capability: "code.test", name: "test", dependsOn: ["code"], build: () => ({}) }),
    T({ capability: "deploy.package", name: "package", dependsOn: ["test"], build: () => ({}) }),
    T({ capability: "deploy.deliver", name: "delivery", dependsOn: ["package"], build: () => ({}) }),
  ],
  "document.analyze": [T({ capability: "document.parse", name: "parse", build: (r) => ({ attachments: r.attachments }) })],
  research: [
    T({ capability: "search.web", name: "search", build: (r) => ({ query: r.input }) }),
    T({ capability: "research.summarize", name: "summarize", dependsOn: ["search"], build: (r) => ({ topic: r.input }) }),
  ],
  general: [T({ capability: "chat.reply", name: "reply", build: (r) => ({ prompt: r.input }) })],
};

export class TaskManager {
  plan(req: UserRequest, intent: IntentAnalysis): ExecutionPlan {
    const blueprint = INTENT_BLUEPRINTS[intent.intent] ?? INTENT_BLUEPRINTS.general;
    const tasks: Task[] = blueprint.map((tpl, i) => ({
      id: `${req.requestId}::${tpl.name}`,
      name: tpl.name,
      capability: tpl.capability,
      dependsOn: (tpl.dependsOn ?? []).map((d) => `${req.requestId}::${d}`),
      input: tpl.build(req, intent),
      priority: tpl.priority ?? i,
      timeoutMs: tpl.timeoutMs ?? 60_000,
      retriable: tpl.retriable ?? true,
    }));

    return {
      planId: `plan_${req.requestId}`,
      intent,
      tasks,
      parallelGroups: this.computeParallelGroups(tasks),
      createdAt: Date.now(),
    };
  }

  /** Kahn-style layering: tasks in the same layer are independent → run in parallel. */
  private computeParallelGroups(tasks: readonly Task[]): readonly (readonly string[])[] {
    const layers: string[][] = [];
    const done = new Set<string>();
    const remaining = new Map(tasks.map((t) => [t.id, t] as const));

    while (remaining.size > 0) {
      const ready: string[] = [];
      for (const t of remaining.values()) {
        if (t.dependsOn.every((d) => done.has(d))) ready.push(t.id);
      }
      if (ready.length === 0) {
        // cyclic — flush remaining as one layer to avoid infinite loop.
        layers.push(Array.from(remaining.keys()));
        break;
      }
      layers.push(ready);
      for (const id of ready) {
        done.add(id);
        remaining.delete(id);
      }
    }
    return layers;
  }
}
