import type { Capability } from "./capability.types";

export interface ModelDescriptor {
  id: string;             // e.g. "noop/echo"
  providerId: string;
  displayName: string;
  capabilities: Capability[];
  contextWindow?: number;
  supportsStreaming?: boolean;
  costHint?: "low" | "medium" | "high";
}
