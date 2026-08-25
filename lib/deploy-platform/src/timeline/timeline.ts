import type { TimelineEvent } from '../types/timeline.js';
import { EventBus } from '../utils/events.js';
import { newId } from '../utils/id.js';

export class TimelineStream {
  readonly bus = new EventBus<TimelineEvent>();
  private events: TimelineEvent[] = [];
  emit(input: Omit<TimelineEvent, 'id' | 'ts'>): TimelineEvent {
    const event: TimelineEvent = { ...input, id: newId('tl'), ts: Date.now() };
    this.events.push(event);
    this.bus.emit(event);
    return event;
  }
  forBuild(buildId: string): readonly TimelineEvent[] {
    return this.events.filter(e => e.buildId === buildId);
  }
  all(): readonly TimelineEvent[] { return [...this.events]; }
}
