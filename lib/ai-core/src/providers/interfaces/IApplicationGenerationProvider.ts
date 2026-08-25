import type { IProvider } from "./IProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";

/** Interface for the "application-generation" capability. */
export interface IApplicationGenerationProvider extends IProvider {
  execute(req: AIRequest): Promise<AIResponse>;
}
