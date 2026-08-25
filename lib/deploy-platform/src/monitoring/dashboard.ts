import type { DeployMetrics } from './metrics.js';
import type { QueueManager } from '../queue/queue-manager.js';
import type { WorkerMonitor } from '../workers/worker-monitor.js';
import type { BuildHistory } from '../history/build-history.js';
import type { BuildRequest } from '../types/build.js';

export class MonitoringDashboard {
  constructor(
    private queues: QueueManager<BuildRequest>,
    private workers: WorkerMonitor,
    private history: BuildHistory,
  ) {}
  snapshot(): DeployMetrics {
    const summary = this.workers.summary();
    const results = this.history.list();
    const durations = results.map(r => r.endedAt - r.startedAt);
    const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const ok = results.filter(r => r.status === 'succeeded').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const total = ok + failed;
    return {
      currentBuilds: summary.busy,
      queueSize: this.queues.totalSize(),
      workers: summary.total,
      averageBuildMs: Math.round(avg),
      successRate: total ? ok / total : 0,
      failureRate: total ? failed / total : 0,
    };
  }
}
