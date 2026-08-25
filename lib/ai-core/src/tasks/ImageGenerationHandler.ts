import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class ImageGenerationHandler extends BaseTaskHandler {
  readonly task = TaskType.ImageGeneration;
}
