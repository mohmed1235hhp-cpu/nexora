export type Listener<T> = (event: T) => void;
export class EventBus<T> {
  private listeners = new Set<Listener<T>>();
  on(fn: Listener<T>): () => void { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(event: T): void { for (const fn of this.listeners) { try { fn(event); } catch { /* swallow */ } } }
  clear(): void { this.listeners.clear(); }
  size(): number { return this.listeners.size; }
}
