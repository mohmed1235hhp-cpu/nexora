import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class TextChatHandler extends BaseTaskHandler {
  readonly task = TaskType.TextChat;
}
