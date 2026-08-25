import type { AgentTask, TaskQueueItem } from "../types/task.types";
import { MAX_QUEUE_SIZE } from "../core/constants";
import { AgentError, AgentErrorCode } from "../core/AgentErrors";

export class TaskQueue {
  private items: TaskQueueItem[] = [];

  enqueue(task: AgentTask): void {
    if (this.items.length >= MAX_QUEUE_SIZE) {
      throw new AgentError(AgentErrorCode.QueueFull, "Task queue is full");
    }
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };
    const item: TaskQueueItem = { task, addedAt: Date.now(), attempts: 0 };
    // Insert by priority
    let inserted = false;
    for (let i = 0; i < this.items.length; i++) {
      if (priorityOrder[task.priority] < priorityOrder[this.items[i].task.priority]) {
        this.items.splice(i, 0, item);
        inserted = true;
        break;
      }
    }
    if (!inserted) this.items.push(item);
  }

  dequeue(): TaskQueueItem | undefined {
    return this.items.shift();
  }

  peek(): TaskQueueItem | undefined {
    return this.items[0];
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }

  getAll(): TaskQueueItem[] {
    return [...this.items];
  }
}
