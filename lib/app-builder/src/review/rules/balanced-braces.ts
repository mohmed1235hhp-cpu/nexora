import type { FileArtifact } from "../../ai/schemas/common";
import type { Issue } from "../ReviewLoop";

export const BalancedBracesRule = {
  name: "balanced-braces",
  check(file: FileArtifact): Issue[] {
    const issues: Issue[] = [];
    const c = file.content;
    let depth = 0;
    for (const ch of c) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      if (depth < 0) break;
    }
    if (depth !== 0) {
      issues.push({ file: file.path, rule: "balanced-braces", severity: "error", message: "Braces do not balance" });
    }
    return issues;
  },
};
