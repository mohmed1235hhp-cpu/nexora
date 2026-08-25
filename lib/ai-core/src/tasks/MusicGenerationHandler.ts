import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class MusicGenerationHandler extends BaseTaskHandler {
  readonly task = TaskType.MusicGeneration;
}
