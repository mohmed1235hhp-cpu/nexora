import type { FileArtifact } from "../../ai/schemas/common";
import type { Issue } from "../ReviewLoop";

export const NoVarRule = {
  name: "no-var",
  check(file: FileArtifact): Issue[] {
    const issues: Issue[] = [];
    const c = file.content;
    if (/\bvar\s+/.test(c)) {
      issues.push({ file: file.path, rule: "no-var", severity: "warn", message: "Use let or const instead of var" });
    }
    return issues;
  },
};
