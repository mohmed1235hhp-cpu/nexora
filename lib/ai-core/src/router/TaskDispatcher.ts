import type { AIRequest } from "../types/request.types";
import type { AIResponse } from "../types/response.types";
import type { TaskType } from "../types/task.types";
import type { BaseTaskHandler } from "../tasks/BaseTaskHandler";
import { noHandler } from "./RouterErrors";

export class TaskDispatcher {
  private handlers = new Map<TaskType, BaseTaskHandler>();

  register(task: TaskType, handler: BaseTaskHandler): void {
    this.handlers.set(task, handler);
  }

  async dispatch(req: AIRequest): Promise<AIResponse> {
    const handler = this.handlers.get(req.task);
    if (!handler) throw noHandler(req.task);
    return handler.handle(req);
  }
}
