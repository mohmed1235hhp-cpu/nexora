import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class SpeechToTextHandler extends BaseTaskHandler {
  readonly task = TaskType.SpeechToText;
}
