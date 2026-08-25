import { SEVERITY_ORDER, type Severity } from "../core/types.js";
export function isLevelEnabled(configured: Severity, incoming: Severity): boolean {
  return SEVERITY_ORDER[incoming] >= SEVERITY_ORDER[configured];
}
export const DEFAULT_LEVEL: Severity = "info";
