import { BaseTaskHandler } from "./BaseTaskHandler";
import { TaskType } from "../types/task.types";

export class VoiceChatHandler extends BaseTaskHandler {
  readonly task = TaskType.VoiceChat;
}
