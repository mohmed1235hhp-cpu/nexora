import type { FileArtifact } from "../../ai/schemas/common";
import type { Issue } from "../ReviewLoop";

export const NoAnyRule = {
  name: "no-any",
  check(file: FileArtifact): Issue[] {
    const issues: Issue[] = [];
    const c = file.content;
    if (/:\s*any\b/.test(c)) {
      issues.push({ file: file.path, rule: "no-any", severity: "warn", message: "Avoid using the any type" });
    }
    return issues;
  },
};
