import { describe, it, expect } from 'vitest';
import { BuildEngine } from '../src/build/engine.js';
import { WorkerPool } from '../src/workers/worker-pool.js';
import { WorkerScheduler } from '../src/workers/worker-scheduler.js';
import { WorkerMonitor } from '../src/workers/worker-monitor.js';
import { makeRequest } from './helpers.js';

describe('Worker subsystem', () => {
  it('schedules a build on a worker and completes it', async () => {
    const pool = new WorkerPool(new BuildEngine(), { size: 2 });
    const scheduler = new WorkerScheduler(pool);
    const monitor = new WorkerMonitor(pool.registry);
    const result = await scheduler.schedule(makeRequest());
    expect(result.status).toBe('succeeded');
    expect(monitor.summary().total).toBe(2);
  });
});
