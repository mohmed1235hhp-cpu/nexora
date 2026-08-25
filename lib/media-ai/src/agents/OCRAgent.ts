import { BaseMediaAgent, type AgentContext } from "./BaseAgent.js";
export interface OCRAgentRequest { input: unknown; options?: Record<string, unknown>; }
export interface OCRAgentResponse { output: unknown; info?: Record<string, unknown>; }
export class OCRAgent extends BaseMediaAgent<OCRAgentRequest, OCRAgentResponse> {
  readonly name = "OCRAgent";
  async run(req: OCRAgentRequest, _ctx: AgentContext): Promise<OCRAgentResponse> {
    return { output: req.input, info: { agent: this.name } };
  }
}
