import { describe, it, expect } from 'vitest';
import { BuildEngine } from '../src/build/engine.js';
import { WorkerPool } from '../src/workers/worker-pool.js';
import { WorkerScheduler } from '../src/workers/worker-scheduler.js';
import { QueueManager } from '../src/queue/queue-manager.js';
import { TaskDispatcher } from '../src/workers/task-dispatcher.js';
import { HostingService } from '../src/hosting/hosting-service.js';
import { PreviewService } from '../src/preview/preview-service.js';
import { ReportGenerator } from '../src/reports/report-generator.js';
import { BuildHistory } from '../src/history/build-history.js';
import { MonitoringDashboard } from '../src/monitoring/dashboard.js';
import { WorkerMonitor } from '../src/workers/worker-monitor.js';
import type { BuildRequest } from '../src/types/build.js';
import { makeRequest } from './helpers.js';

describe('End-to-end deployment flow', () => {
  it('runs build → host → preview → report', async () => {
    const engine = new BuildEngine();
    const pool = new WorkerPool(engine, { size: 1 });
    const scheduler = new WorkerScheduler(pool);
    const queues = new QueueManager<BuildRequest>();
    const dispatcher = new TaskDispatcher(queues, scheduler);
    const hosting = new HostingService();
    const preview = new PreviewService();
    const reports = new ReportGenerator();
    const history = new BuildHistory();
    const monitor = new WorkerMonitor(pool.registry);
    const dashboard = new MonitoringDashboard(queues, monitor, history);

    const result = await dispatcher.submit(makeRequest({ priority: 'high' }));
    history.add(result);
    const hp = await hosting.publish({ projectId: result.projectId, buildId: result.id, artifactIds: [] });
    const p = await preview.create({ projectId: result.projectId, buildId: result.id, artifactIds: [] });
    const buildReport = reports.buildReport(result);
    const deployReport = reports.deploymentReport(hp);
    const snap = dashboard.snapshot();

    expect(result.status).toBe('succeeded');
    expect(hp.internalUrl).toBeTruthy();
    expect(p.url).toBeTruthy();
    expect(buildReport.durationMs).toBeGreaterThanOrEqual(0);
    expect(deployReport.internalUrl).toBe(hp.internalUrl);
    expect(snap.workers).toBe(1);
  });
});
