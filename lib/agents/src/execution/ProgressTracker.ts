export interface ProgressUpdate {
  agentId: string;
  taskId: string;
  status: "started" | "in-progress" | "completed" | "failed";
  progress: number;
  filesCount: number;
  errorsCount: number;
  startedAt: number;
  updatedAt: number;
}

export class ProgressTracker {
  private updates = new Map<string, ProgressUpdate>();

  start(taskId: string, agentId: string): void {
    this.updates.set(taskId, {
      agentId, taskId, status: "started", progress: 0,
      filesCount: 0, errorsCount: 0,
      startedAt: Date.now(), updatedAt: Date.now(),
    });
  }

  update(taskId: string, patch: Partial<ProgressUpdate>): void {
    const existing = this.updates.get(taskId);
    if (existing) {
      Object.assign(existing, patch, { updatedAt: Date.now() });
    }
  }

  complete(taskId: string, ok: boolean): void {
    this.update(taskId, { status: ok ? "completed" : "failed", progress: 100 });
  }

  getProgress(taskId: string): ProgressUpdate | undefined {
    return this.updates.get(taskId);
  }

  getAllProgress(): ProgressUpdate[] {
    return Array.from(this.updates.values());
  }
}
