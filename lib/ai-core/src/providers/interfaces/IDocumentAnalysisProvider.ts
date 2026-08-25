import type { IProvider } from "./IProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";

/** Interface for the "document-analysis" capability. */
export interface IDocumentAnalysisProvider extends IProvider {
  execute(req: AIRequest): Promise<AIResponse>;
}
