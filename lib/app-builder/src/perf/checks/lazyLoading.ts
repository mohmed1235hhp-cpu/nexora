import type { FileArtifact } from "../../ai/schemas/common";
import type { PerfHint } from "../PerfPass";

export function checkLazyLoading(f: FileArtifact): PerfHint[] {
  const hints: PerfHint[] = [];
  const c = f.content;
  if (/import\s+\w+\s+from\s+["'].+["']/.test(c) && !/React\.lazy|lazy\(/.test(c) && f.path.includes("/routes/")) {
    hints.push({ file: f.path, hint: "Consider React.lazy for route", severity: "info" });
  }
  return hints;
}
