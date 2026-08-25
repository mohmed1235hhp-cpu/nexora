import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class InternetSearchHandler extends BaseTaskHandler {
  readonly task = TaskType.InternetSearch;
}
