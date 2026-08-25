import { describe, it, expect } from 'vitest';
import { MonitoringBus } from '../src/monitoring/MonitoringBus.js';

describe('MonitoringBus', () => {
  it('delivers events to subscribers and replays on subscribe', () => {
    const bus = new MonitoringBus(10);
    bus.publish('agent.log', 'a', { m: 1 });
    bus.publish('agent.log', 'a', { m: 2 });

    const seen: number[] = [];
    bus.subscribe(e => { seen.push((e.payload as { m: number }).m); }, { replay: 10 });
    bus.publish('agent.log', 'a', { m: 3 });
    expect(seen).toEqual([1, 2, 3]);
  });

  it('isolates listener errors', () => {
    const bus = new MonitoringBus();
    bus.subscribe(() => { throw new Error('boom'); });
    let ok = 0;
    bus.subscribe(() => { ok += 1; });
    bus.publish('agent.log', 's', {});
    expect(ok).toBe(1);
  });
});
