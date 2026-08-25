import type { IProvider } from "./IProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";

/** Interface for the "bug-fix" capability. */
export interface IBugFixProvider extends IProvider {
  execute(req: AIRequest): Promise<AIResponse>;
}
