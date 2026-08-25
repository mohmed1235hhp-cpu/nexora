import type { IBuildWorker } from '../interfaces/IBuildWorker.js';
import type { IBuildEngine } from '../interfaces/IBuildEngine.js';
import type { BuildRequest, BuildResult } from '../types/build.js';
import type { WorkerInfo, WorkerStatus } from '../types/worker.js';
import { newId } from '../utils/id.js';

export class BuildWorker implements IBuildWorker {
  private status: WorkerStatus = 'idle';
  private currentBuildId?: string;
  private readonly startedAt = Date.now();
  private lastHeartbeat = Date.now();
  private processed = 0;
  private failed = 0;
  readonly id: string;
  readonly name: string;

  constructor(private engine: IBuildEngine, name?: string) {
    this.id = newId('worker'); this.name = name ?? this.id;
  }
  info(): WorkerInfo {
    return { id: this.id, name: this.name, status: this.status, currentBuildId: this.currentBuildId,
      startedAt: this.startedAt, lastHeartbeat: this.lastHeartbeat, processed: this.processed, failed: this.failed };
  }
  async process(request: BuildRequest): Promise<BuildResult> {
    this.status = 'busy'; this.currentBuildId = request.id; this.lastHeartbeat = Date.now();
    try {
      const result = await this.engine.build(request);
      if (result.status === 'succeeded') this.processed += 1; else this.failed += 1;
      return result;
    } finally {
      this.currentBuildId = undefined;
      this.status = 'idle';
      this.lastHeartbeat = Date.now();
    }
  }
  async drain(): Promise<void> { this.status = 'draining'; }
}
