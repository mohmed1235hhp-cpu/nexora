import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class WebsiteGenerationHandler extends BaseTaskHandler {
  readonly task = TaskType.WebsiteGeneration;
}
