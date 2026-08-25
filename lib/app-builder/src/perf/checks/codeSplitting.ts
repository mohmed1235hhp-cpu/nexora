import type { FileArtifact } from "../../ai/schemas/common";
import type { PerfHint } from "../PerfPass";

export function checkCodeSplitting(f: FileArtifact): PerfHint[] {
  const hints: PerfHint[] = [];
  if (f.path.includes("/pages/") && !/lazy\(/.test(f.content)) {
    hints.push({ file: f.path, hint: "Split page bundle with dynamic import", severity: "info" });
  }
  return hints;
}
