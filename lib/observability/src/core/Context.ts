import type { Tags, ObservabilityDomain } from "./types.js";
export interface ObservabilityContext {
  readonly traceId?: string;
  readonly spanId?:  string;
  readonly userId?:  string;
  readonly projectId?: string;
  readonly requestId?: string;
  readonly domain?:  ObservabilityDomain;
  readonly tags?:    Tags;
}
export function mergeContext(
  a: ObservabilityContext | undefined,
  b: ObservabilityContext | undefined,
): ObservabilityContext {
  return {
    ...(a ?? {}),
    ...(b ?? {}),
    tags: { ...(a?.tags ?? {}), ...(b?.tags ?? {}) },
  };
}
