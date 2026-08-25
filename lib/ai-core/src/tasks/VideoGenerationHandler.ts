import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class VideoGenerationHandler extends BaseTaskHandler {
  readonly task = TaskType.VideoGeneration;
}
