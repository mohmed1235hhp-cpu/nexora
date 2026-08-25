import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class TextToSpeechHandler extends BaseTaskHandler {
  readonly task = TaskType.TextToSpeech;
}
