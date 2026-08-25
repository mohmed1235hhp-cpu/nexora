import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class BugFixHandler extends BaseTaskHandler {
  readonly task = TaskType.BugFix;
}
