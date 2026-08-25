type Handler<T = unknown> = (payload: T) => void;
export class EventBus {
  private map = new Map<string, Set<Handler>>();
  on<T = unknown>(event: string, handler: Handler<T>): () => void {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event)!.add(handler as Handler);
    return () => this.off(event, handler);
  }
  off<T = unknown>(event: string, handler: Handler<T>): void {
    this.map.get(event)?.delete(handler as Handler);
  }
  emit<T = unknown>(event: string, payload: T): void {
    this.map.get(event)?.forEach(h => { try { h(payload); } catch {} });
  }
  clear(): void { this.map.clear(); }
}
export const globalBus = new EventBus();
