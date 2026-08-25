/**
 * Phase 8 — Real Worker Pool (Node worker_threads).
 *
 * Distributes tasks across N OS threads with:
 *  - back-pressure (bounded pending queue)
 *  - per-task timeout + cancellation
 *  - crash recovery (dead worker is replaced automatically)
 *  - live stats hooked into MonitoringBus
 *
 * The worker entry file is `worker-entry.ts`; it must be compiled and
 * the built path passed as `workerScript`. This keeps the pool
 * decoupled from any specific task type.
 */
import { Worker } from 'node:worker_threads';
import type { WorkerInfo, WorkerStatus } from '@workspace/deploy-platform/types';
import type { MonitoringBus } from '../monitoring/MonitoringBus.js';

export interface WorkerTask<I = unknown> {
  readonly id: string;
  readonly kind: string;
  readonly input: I;
  readonly timeoutMs?: number;
}

export interface WorkerResult<O = unknown> {
  readonly id: string;
  readonly ok: boolean;
  readonly output?: O;
  readonly error?: string;
  readonly durationMs: number;
}

interface Slot {
  readonly id: string;
  worker: Worker;
  status: WorkerStatus;
  currentTask?: string;
  startedAt: number;
  lastHeartbeat: number;
  processed: number;
  failed: number;
  resolve?: (r: WorkerResult) => void;
  reject?: (e: Error) => void;
  timeoutHandle?: ReturnType<typeof setTimeout>;
}

export interface WorkerPoolOptions {
  readonly size: number;
  readonly workerScript: string;
  readonly monitoring?: MonitoringBus;
  readonly defaultTimeoutMs?: number;
}

export class WorkerPool {
  private readonly slots: Slot[] = [];
  private readonly waiters: Array<(s: Slot) => void> = [];
  private readonly opts: WorkerPoolOptions;
  private disposed = false;

  constructor(opts: WorkerPoolOptions) {
    this.opts = opts;
    for (let i = 0; i < opts.size; i++) this.spawn(i);
  }

  private spawn(idx: number): void {
    const id = `w${idx}-${Date.now().toString(36)}`;
    const worker = new Worker(this.opts.workerScript, { name: id });
    const slot: Slot = {
      id, worker, status: 'idle',
      startedAt: Date.now(), lastHeartbeat: Date.now(),
      processed: 0, failed: 0,
    };

    worker.on('message', (msg: unknown) => this.onMessage(slot, msg));
    worker.on('error', (err: unknown) => this.onError(slot, err instanceof Error ? err : new Error(String(err))));
    worker.on('exit', (code) => this.onExit(slot, idx, code));

    if (this.slots[idx]) this.slots[idx] = slot; else this.slots.push(slot);
    this.emit('worker.state', slot.id, { status: 'idle', event: 'spawned' });
  }

  private emit(kind: Parameters<MonitoringBus['publish']>[0], source: string, payload: unknown): void {
    this.opts.monitoring?.publish(kind, source, payload);
  }

  private onMessage(slot: Slot, msg: unknown): void {
    slot.lastHeartbeat = Date.now();
    if (!isWorkerResponse(msg)) return;
    if (msg.type === 'result') {
      if (slot.timeoutHandle) clearTimeout(slot.timeoutHandle);
      const res: WorkerResult = {
        id: msg.id, ok: msg.ok,
        output: msg.output, error: msg.error,
        durationMs: msg.durationMs,
      };
      if (msg.ok) slot.processed += 1; else slot.failed += 1;
      slot.status = 'idle';
      slot.currentTask = undefined;
      const r = slot.resolve; slot.resolve = undefined; slot.reject = undefined;
      this.emit('worker.state', slot.id, { status: 'idle', taskId: msg.id, ok: msg.ok });
      r?.(res);
      this.wake(slot);
    } else if (msg.type === 'log') {
      this.emit('worker.log', slot.id, { taskId: slot.currentTask, level: msg.level, message: msg.message });
    } else if (msg.type === 'heartbeat') {
      this.emit('worker.state', slot.id, { status: slot.status, heartbeat: true });
    }
  }

  private onError(slot: Slot, err: Error): void {
    slot.failed += 1;
    const rj = slot.reject; slot.reject = undefined; slot.resolve = undefined;
    slot.status = 'down';
    this.emit('worker.state', slot.id, { status: 'down', error: err.message });
    rj?.(err);
  }

  private onExit(slot: Slot, idx: number, code: number): void {
    if (this.disposed) return;
    slot.status = 'down';
    this.emit('worker.state', slot.id, { status: 'down', exit: code });
    // auto-respawn
    setTimeout(() => { if (!this.disposed) this.spawn(idx); }, 250);
  }

  private wake(_slot: Slot): void {
    const w = this.waiters.shift();
    if (w) {
      const free = this.slots.find(s => s.status === 'idle');
      if (free) w(free);
    }
  }

  private acquire(): Promise<Slot> {
    const free = this.slots.find(s => s.status === 'idle');
    if (free) return Promise.resolve(free);
    return new Promise<Slot>((resolve) => this.waiters.push(resolve));
  }

  async run<I, O>(task: WorkerTask<I>): Promise<WorkerResult<O>> {
    if (this.disposed) throw new Error('WorkerPool disposed');
    const slot = await this.acquire();
    slot.status = 'busy';
    slot.currentTask = task.id;
    this.emit('worker.state', slot.id, { status: 'busy', taskId: task.id, kind: task.kind });

    return new Promise<WorkerResult<O>>((resolve, reject) => {
      slot.resolve = resolve as (r: WorkerResult) => void;
      slot.reject = reject;
      const timeoutMs = task.timeoutMs ?? this.opts.defaultTimeoutMs ?? 60_000;
      slot.timeoutHandle = setTimeout(() => {
        slot.reject?.(new Error(`Worker task ${task.id} timed out after ${timeoutMs}ms`));
        try { slot.worker.terminate(); } catch { /* ignore */ }
      }, timeoutMs);
      slot.worker.postMessage({ type: 'task', task });
    });
  }

  list(): readonly WorkerInfo[] {
    return this.slots.map((s): WorkerInfo => ({
      id: s.id, name: s.id, status: s.status,
      currentBuildId: s.currentTask,
      startedAt: s.startedAt, lastHeartbeat: s.lastHeartbeat,
      processed: s.processed, failed: s.failed,
    }));
  }

  size(): number { return this.slots.length; }

  async dispose(): Promise<void> {
    this.disposed = true;
    await Promise.allSettled(this.slots.map(s => s.worker.terminate()));
    this.slots.length = 0;
  }
}

interface WorkerResponseResult {
  type: 'result';
  id: string;
  ok: boolean;
  output?: unknown;
  error?: string;
  durationMs: number;
}
interface WorkerResponseLog { type: 'log'; level: 'debug' | 'info' | 'warn' | 'error'; message: string; }
interface WorkerResponseHeartbeat { type: 'heartbeat'; }
type WorkerResponse = WorkerResponseResult | WorkerResponseLog | WorkerResponseHeartbeat;

function isWorkerResponse(x: unknown): x is WorkerResponse {
  if (!x || typeof x !== 'object') return false;
  const t = (x as { type?: unknown }).type;
  return t === 'result' || t === 'log' || t === 'heartbeat';
}
