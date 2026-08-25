import { AIError, AIErrorCode } from "../types/error.types";

export const noHandler = (task: string) =>
  new AIError(AIErrorCode.CapabilityUnsupported, `No handler registered for task "${task}"`);

export const noProvider = (capability: string) =>
  new AIError(AIErrorCode.ProviderNotConfigured, `No provider available for capability "${capability}"`);
