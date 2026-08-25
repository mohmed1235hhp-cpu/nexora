/**
 * Phase 8 — Worker thread entry point.
 *
 * Runs inside a Node worker_threads Worker. Receives `{ type: 'task', task }`
 * messages, invokes the registered handler for the task's `kind`, and
 * posts back a result. Handlers are registered at module scope so they
 * are shared across all task invocations for the life of the thread.
 */
import { parentPort } from 'node:worker_threads';

export interface WorkerHandlerCtx {
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void;
}
export type WorkerHandler<I = unknown, O = unknown> = (input: I, ctx: WorkerHandlerCtx) => Promise<O> | O;

const handlers = new Map<string, WorkerHandler>();

export function registerHandler<I, O>(kind: string, fn: WorkerHandler<I, O>): void {
  handlers.set(kind, fn as WorkerHandler);
}

if (parentPort) {
  const port = parentPort;
  const ctx: WorkerHandlerCtx = {
    log(level, message) { port.postMessage({ type: 'log', level, message }); },
  };

  // Heartbeat every 5s so the pool knows we're alive.
  const hb = setInterval(() => { try { port.postMessage({ type: 'heartbeat' }); } catch { /* ignore */ } }, 5000);
  hb.unref?.();

  port.on('message', (msg: unknown) => {
    if (!msg || typeof msg !== 'object' || (msg as { type?: unknown }).type !== 'task') return;
    const task = (msg as { task: { id: string; kind: string; input: unknown } }).task;
    const started = Date.now();
    const handler = handlers.get(task.kind);
    const done = (ok: boolean, output?: unknown, error?: string): void => {
      port.postMessage({ type: 'result', id: task.id, ok, output, error, durationMs: Date.now() - started });
    };
    if (!handler) { done(false, undefined, `no handler for kind ${task.kind}`); return; }
    Promise.resolve()
      .then(() => handler(task.input, ctx))
      .then((out) => done(true, out))
      .catch((err: unknown) => done(false, undefined, err instanceof Error ? err.message : String(err)));
  });
}

// Default handlers — safe, side-effect-free examples users can extend.
registerHandler('noop', () => ({ ok: true }));
registerHandler('echo', (input) => input);
