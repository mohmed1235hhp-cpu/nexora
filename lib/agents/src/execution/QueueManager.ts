import type { AgentTask } from "../types/task.types";
import { TaskQueue } from "./TaskQueue";

export class QueueManager {
  private queues = new Map<string, TaskQueue>();

  getQueue(agentId: string): TaskQueue {
    let q = this.queues.get(agentId);
    if (!q) {
      q = new TaskQueue();
      this.queues.set(agentId, q);
    }
    return q;
  }

  enqueueForAgent(agentId: string, task: AgentTask): void {
    this.getQueue(agentId).enqueue(task);
  }

  getTotalPending(): number {
    let total = 0;
    for (const q of this.queues.values()) total += q.size();
    return total;
  }

  getPendingByAgent(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [id, q] of this.queues.entries()) {
      result[id] = q.size();
    }
    return result;
  }
}
