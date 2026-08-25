import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class CodeExecutionHandler extends BaseTaskHandler {
  readonly task = TaskType.CodeExecution;
}
