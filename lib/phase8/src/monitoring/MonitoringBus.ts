/**
 * Phase 8 — Monitoring bus.
 *
 * In-process pub/sub for agent / worker / build events. Backed by an
 * optional durable store (see `PersistentEventStore`) so the SSE
 * endpoint can replay recent events after a reconnect.
 *
 * Kept dependency-free (no `events` module) so it works on any runtime.
 */

export type EventKind =
  | 'agent.state'
  | 'agent.log'
  | 'worker.state'
  | 'worker.log'
  | 'build.progress'
  | 'build.log'
  | 'queue.stats'
  | 'resource.usage'
  | 'pipeline.step';

export interface MonitoringEvent<P = unknown> {
  readonly id: string;
  readonly ts: number;
  readonly kind: EventKind;
  readonly source: string;
  readonly payload: P;
}

export type Listener = (e: MonitoringEvent) => void;

let _seq = 0;
const nextId = (): string => `${Date.now().toString(36)}-${(_seq++).toString(36)}`;

export class MonitoringBus {
  private readonly listeners = new Set<Listener>();
  private readonly ring: MonitoringEvent[] = [];
  private readonly capacity: number;

  constructor(capacity = 1000) {
    this.capacity = Math.max(16, capacity);
  }

  publish<P>(kind: EventKind, source: string, payload: P): MonitoringEvent<P> {
    const ev: MonitoringEvent<P> = { id: nextId(), ts: Date.now(), kind, source, payload };
    this.ring.push(ev);
    if (this.ring.length > this.capacity) this.ring.splice(0, this.ring.length - this.capacity);
    for (const l of this.listeners) {
      try { l(ev); } catch { /* swallow, one bad subscriber must not break others */ }
    }
    return ev;
  }

  subscribe(listener: Listener, opts?: { replay?: number }): () => void {
    if (opts?.replay && opts.replay > 0) {
      const slice = this.ring.slice(-opts.replay);
      for (const e of slice) { try { listener(e); } catch { /* ignore */ } }
    }
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  snapshot(): readonly MonitoringEvent[] {
    return this.ring.slice();
  }

  size(): number { return this.ring.length; }
  listenerCount(): number { return this.listeners.size; }
}

/** Singleton bus for the in-process default use-case. */
let _global: MonitoringBus | undefined;
export function getMonitoringBus(): MonitoringBus {
  if (!_global) _global = new MonitoringBus();
  return _global;
}
