import type { FileArtifact } from "../../ai/schemas/common";
import type { PerfHint } from "../PerfPass";

export function checkVirtualLists(f: FileArtifact): PerfHint[] {
  const hints: PerfHint[] = [];
  if (/\.map\(/.test(f.content) && /list|List/i.test(f.path)) {
    hints.push({ file: f.path, hint: "Consider a virtual list for large collections", severity: "info" });
  }
  return hints;
}
