import type { TimelineEventData } from "../types/timeline.types";

type Listener = (event: TimelineEventData) => void;

export class TimelineEmitter {
  private listeners = new Set<Listener>();
  private history: TimelineEventData[] = [];

  emit(event: TimelineEventData): void {
    this.history.push(event);
    for (const listener of this.listeners) listener(event);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getHistory(): TimelineEventData[] {
    return [...this.history];
  }

  clear(): void {
    this.history = [];
  }
}
