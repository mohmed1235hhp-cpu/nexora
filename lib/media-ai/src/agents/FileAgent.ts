import { BaseMediaAgent, type AgentContext } from "./BaseAgent.js";
export interface FileAgentRequest { input: unknown; options?: Record<string, unknown>; }
export interface FileAgentResponse { output: unknown; info?: Record<string, unknown>; }
export class FileAgent extends BaseMediaAgent<FileAgentRequest, FileAgentResponse> {
  readonly name = "FileAgent";
  async run(req: FileAgentRequest, _ctx: AgentContext): Promise<FileAgentResponse> {
    return { output: req.input, info: { agent: this.name } };
  }
}
