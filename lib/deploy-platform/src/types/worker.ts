export type WorkerStatus = 'idle' | 'busy' | 'draining' | 'down';
export interface WorkerInfo {
  readonly id: string;
  readonly name: string;
  readonly status: WorkerStatus;
  readonly currentBuildId?: string;
  readonly startedAt: number;
  readonly lastHeartbeat: number;
  readonly processed: number;
  readonly failed: number;
}
