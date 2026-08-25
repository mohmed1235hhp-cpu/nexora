export { NoEvalRule } from "./no-eval";
export { NoHardcodedSecretRule } from "./no-hardcoded-secret";
export { NoDangerousHtmlRule } from "./no-dangerous-html";
export { NoHttpRule } from "./no-http";
export { NoLocalStorageTokenRule } from "./no-localStorage-token";

import { NoEvalRule } from "./no-eval";
import { NoHardcodedSecretRule } from "./no-hardcoded-secret";
import { NoDangerousHtmlRule } from "./no-dangerous-html";
import { NoHttpRule } from "./no-http";
import { NoLocalStorageTokenRule } from "./no-localStorage-token";

/** Registry of every built-in security rule. Consumed by SecurityPass. */
export const ALL_SECURITY_RULES = [
  NoEvalRule,
  NoHardcodedSecretRule,
  NoDangerousHtmlRule,
  NoHttpRule,
  NoLocalStorageTokenRule,
] as const;
