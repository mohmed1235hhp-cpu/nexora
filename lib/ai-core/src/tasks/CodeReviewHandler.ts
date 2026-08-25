import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class CodeReviewHandler extends BaseTaskHandler {
  readonly task = TaskType.CodeReview;
}
