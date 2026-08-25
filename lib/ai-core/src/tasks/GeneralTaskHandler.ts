import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class GeneralTaskHandler extends BaseTaskHandler {
  readonly task = TaskType.GeneralAI;
}
