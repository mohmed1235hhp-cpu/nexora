import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class DocumentAnalysisHandler extends BaseTaskHandler {
  readonly task = TaskType.DocumentAnalysis;
}
