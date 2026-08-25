import type { IProvider } from "./IProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";

/** Interface for the "website-generation" capability. */
export interface IWebsiteGenerationProvider extends IProvider {
  execute(req: AIRequest): Promise<AIResponse>;
}
