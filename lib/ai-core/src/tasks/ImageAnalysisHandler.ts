import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class ImageAnalysisHandler extends BaseTaskHandler {
  readonly task = TaskType.ImageAnalysis;
}
