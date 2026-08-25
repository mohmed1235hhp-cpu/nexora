export type EventHandler<T> = (e: T) => void;
export class EventBus<T> {
  private handlers = new Set<EventHandler<T>>();
  on(h: EventHandler<T>) { this.handlers.add(h); return () => this.handlers.delete(h); }
  emit(e: T) { for (const h of this.handlers) h(e); }
}
