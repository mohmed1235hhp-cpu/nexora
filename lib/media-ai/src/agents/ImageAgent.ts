import { BaseMediaAgent, type AgentContext } from "./BaseAgent.js";
export interface ImageAgentRequest { input: unknown; options?: Record<string, unknown>; }
export interface ImageAgentResponse { output: unknown; info?: Record<string, unknown>; }
export class ImageAgent extends BaseMediaAgent<ImageAgentRequest, ImageAgentResponse> {
  readonly name = "ImageAgent";
  async run(req: ImageAgentRequest, _ctx: AgentContext): Promise<ImageAgentResponse> {
    return { output: req.input, info: { agent: this.name } };
  }
}
