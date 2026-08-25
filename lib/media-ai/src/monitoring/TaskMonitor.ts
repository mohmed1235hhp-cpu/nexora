export interface TaskProgress {
  taskId: string; mediaType: string; agent?: string;
  progress: number; startedAt: number; updatedAt: number; errors: string[];
}
export class TaskMonitor {
  private tasks = new Map<string, TaskProgress>();
  start(taskId: string, mediaType: string, agent?: string): void {
    this.tasks.set(taskId, { taskId, mediaType, agent, progress: 0, startedAt: Date.now(), updatedAt: Date.now(), errors: [] });
  }
  update(taskId: string, progress: number): void {
    const t = this.tasks.get(taskId); if (!t) return;
    t.progress = progress; t.updatedAt = Date.now();
  }
  error(taskId: string, msg: string): void {
    const t = this.tasks.get(taskId); if (!t) return;
    t.errors.push(msg); t.updatedAt = Date.now();
  }
  get(taskId: string): TaskProgress | undefined { return this.tasks.get(taskId); }
  list(): TaskProgress[] { return [...this.tasks.values()]; }
}
