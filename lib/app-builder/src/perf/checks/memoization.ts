import type { FileArtifact } from "../../ai/schemas/common";
import type { PerfHint } from "../PerfPass";

export function checkMemoization(f: FileArtifact): PerfHint[] {
  const hints: PerfHint[] = [];
  const c = f.content;
  if (/export function [A-Z]\w+\(/.test(c) && !/memo\(/.test(c)) {
    hints.push({ file: f.path, hint: "Consider React.memo for pure component", severity: "info" });
  }
  return hints;
}
