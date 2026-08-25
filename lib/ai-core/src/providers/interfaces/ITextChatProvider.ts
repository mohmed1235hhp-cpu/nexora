import type { IProvider } from "./IProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";

/** Interface for the "text-chat" capability. */
export interface ITextChatProvider extends IProvider {
  execute(req: AIRequest): Promise<AIResponse>;
}
