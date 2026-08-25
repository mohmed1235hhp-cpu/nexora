import type { AIRequest } from "../../types/request.types";
import { TaskType } from "../../types/task.types";

export const sampleTextChat: AIRequest = {
  task: TaskType.TextChat,
  input: { message: "hello" },
  meta: { userId: "test-user" },
};

export const sampleImageGen: AIRequest = {
  task: TaskType.ImageGeneration,
  input: { prompt: "a cat" },
};
