import type { FileArtifact } from "../../ai/schemas/common";
import type { Issue } from "../ReviewLoop";

export const NoRelativeDeepRule = {
  name: "no-relative-deep",
  check(file: FileArtifact): Issue[] {
    const issues: Issue[] = [];
    const c = file.content;
    if (/from\s+[\"\x27](\.\.\/){3,}/.test(c)) {
      issues.push({ file: file.path, rule: "no-relative-deep", severity: "warn", message: "Avoid deep ../../.. relative imports" });
    }
    return issues;
  },
};
