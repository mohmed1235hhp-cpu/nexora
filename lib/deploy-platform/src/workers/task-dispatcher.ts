import type { ITaskDispatcher } from '../interfaces/ITaskDispatcher.js';
import type { BuildRequest, BuildResult } from '../types/build.js';
import type { IWorkerScheduler } from '../interfaces/IWorkerScheduler.js';
import type { QueueManager } from '../queue/queue-manager.js';

export class TaskDispatcher implements ITaskDispatcher {
  private cancels = new Set<string>();
  constructor(private queues: QueueManager<BuildRequest>, private scheduler: IWorkerScheduler) {}

  async submit(request: BuildRequest): Promise<BuildResult> {
    const q =
      request.priority === 'premium' ? this.queues.premiumQ :
      request.priority === 'high' ? this.queues.priorityQ :
      request.priority === 'low' ? this.queues.delayedQ :
      this.queues.globalQ;
    q.enqueue(request, { priority: request.priority === 'premium' ? 100 : request.priority === 'high' ? 10 : 0 });
    if (this.cancels.has(request.id)) {
      this.cancels.delete(request.id);
      return {
        id: request.id, projectId: request.project.id, status: 'cancelled',
        stages: [], startedAt: Date.now(), endedAt: Date.now(), artifactIds: [],
      };
    }
    return this.scheduler.schedule(request);
  }
  async cancel(buildId: string): Promise<boolean> { this.cancels.add(buildId); return true; }
}
