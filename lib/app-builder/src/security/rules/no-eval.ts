import type { FileArtifact } from "../../ai/schemas/common";
import type { SecurityFinding } from "../SecurityPass";

export const NoEvalRule = {
  name: "no-eval",
  description: "Blocks use of eval / Function constructor",
  check(f: FileArtifact): SecurityFinding[] {
    const out: SecurityFinding[] = [];
    if (/\beval\s*\(|new\s+Function\s*\(/.test(f.content)) {
      out.push({ file: f.path, rule: "no-eval", severity: "high", message: "eval() or new Function() detected" });
    }
    return out;
  },
};
