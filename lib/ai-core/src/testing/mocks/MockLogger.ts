import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";

export class MockLogger {
  entries: Array<{ req: AIRequest; res?: AIResponse; error?: string }> = [];
  logRequest(req: AIRequest, res: AIResponse): void {
    this.entries.push({ req, res });
  }
  logError(req: AIRequest, err: Error): void {
    this.entries.push({ req, error: err.message });
  }
}
