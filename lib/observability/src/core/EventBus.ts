export type Listener<T> = (event: T) => void | Promise<void>;
export interface Subscription { unsubscribe(): void; }
/** Tiny in-process pub/sub with error isolation. */
export class EventBus<T> {
  private readonly listeners = new Set<Listener<T>>();
  subscribe(fn: Listener<T>): Subscription {
    this.listeners.add(fn);
    return { unsubscribe: () => this.listeners.delete(fn) };
  }
  async publish(event: T): Promise<void> {
    for (const l of this.listeners) {
      try { await l(event); } catch (err) {
        // Never let a bad listener kill the bus.
        try { console.error("[observability.EventBus] listener error", err); } catch { /* ignore */ }
      }
    }
  }
  size(): number { return this.listeners.size; }
  clear(): void { this.listeners.clear(); }
}
