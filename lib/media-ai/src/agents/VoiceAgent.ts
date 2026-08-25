import { BaseMediaAgent, type AgentContext } from "./BaseAgent.js";
export interface VoiceAgentRequest { input: unknown; options?: Record<string, unknown>; }
export interface VoiceAgentResponse { output: unknown; info?: Record<string, unknown>; }
export class VoiceAgent extends BaseMediaAgent<VoiceAgentRequest, VoiceAgentResponse> {
  readonly name = "VoiceAgent";
  async run(req: VoiceAgentRequest, _ctx: AgentContext): Promise<VoiceAgentResponse> {
    return { output: req.input, info: { agent: this.name } };
  }
}
