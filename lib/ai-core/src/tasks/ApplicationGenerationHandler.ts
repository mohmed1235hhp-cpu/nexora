import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class ApplicationGenerationHandler extends BaseTaskHandler {
  readonly task = TaskType.ApplicationGeneration;
}
