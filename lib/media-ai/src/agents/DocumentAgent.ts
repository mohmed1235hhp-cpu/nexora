import { BaseMediaAgent, type AgentContext } from "./BaseAgent.js";
export interface DocumentAgentRequest { input: unknown; options?: Record<string, unknown>; }
export interface DocumentAgentResponse { output: unknown; info?: Record<string, unknown>; }
export class DocumentAgent extends BaseMediaAgent<DocumentAgentRequest, DocumentAgentResponse> {
  readonly name = "DocumentAgent";
  async run(req: DocumentAgentRequest, _ctx: AgentContext): Promise<DocumentAgentResponse> {
    return { output: req.input, info: { agent: this.name } };
  }
}
