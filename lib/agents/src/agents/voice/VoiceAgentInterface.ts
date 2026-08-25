import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IVoiceAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const VoiceAgentDescriptor: AgentDescriptor = {
  id: "voice",
  name: "VoiceAgent",
  description: "Handles voice-related tasks (TTS/STT/analysis)",
  capabilities: ["voice-processing"],
  priority: 1,
};
