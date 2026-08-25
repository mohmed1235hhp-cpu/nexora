import type { TaskType } from "./task.types";

/** Capability = what a provider can do. Mapped 1-1 to TaskType for now. */
export type Capability = TaskType;

export interface CapabilityDescriptor {
  capability: Capability;
  streaming: boolean;
  maxInputTokens?: number;
  maxOutputTokens?: number;
}
