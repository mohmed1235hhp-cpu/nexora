export { BalancedBracesRule } from "./balanced-braces";
export { HasExportRule } from "./has-export";
export { HasNewlineRule } from "./has-newline";
export { NoAnyRule } from "./no-any";
export { NoConsoleLogRule } from "./no-console-log";
export { NoEmptyFileRule } from "./no-empty-file";
export { NoHardcodedColorRule } from "./no-hardcoded-color";
export { NoRelativeDeepRule } from "./no-relative-deep";
export { NoTodoRule } from "./no-todo";
export { NoVarRule } from "./no-var";

import { BalancedBracesRule } from "./balanced-braces";
import { HasExportRule } from "./has-export";
import { HasNewlineRule } from "./has-newline";
import { NoAnyRule } from "./no-any";
import { NoConsoleLogRule } from "./no-console-log";
import { NoEmptyFileRule } from "./no-empty-file";
import { NoHardcodedColorRule } from "./no-hardcoded-color";
import { NoRelativeDeepRule } from "./no-relative-deep";
import { NoTodoRule } from "./no-todo";
import { NoVarRule } from "./no-var";

/** Registry of every built-in review rule. Consumed by ReviewLoop. */
export const ALL_REVIEW_RULES = [
  BalancedBracesRule,
  HasExportRule,
  HasNewlineRule,
  NoAnyRule,
  NoConsoleLogRule,
  NoEmptyFileRule,
  NoHardcodedColorRule,
  NoRelativeDeepRule,
  NoTodoRule,
  NoVarRule,
] as const;
