import type { FileArtifact } from "../../ai/schemas/common";
import type { PerfHint } from "../PerfPass";

export function checkBundleAudit(f: FileArtifact): PerfHint[] {
  const hints: PerfHint[] = [];
  if (/moment|lodash(?![-/])/.test(f.content)) {
    hints.push({ file: f.path, hint: "Heavy dependency detected; prefer lighter alternative", severity: "warn" });
  }
  return hints;
}
