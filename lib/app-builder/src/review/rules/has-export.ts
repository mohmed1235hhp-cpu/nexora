import type { FileArtifact } from "../../ai/schemas/common";
import type { Issue } from "../ReviewLoop";

export const HasExportRule = {
  name: "has-export",
  check(file: FileArtifact): Issue[] {
    const issues: Issue[] = [];
    const c = file.content;
    if (!/\bexport\b/.test(c)) {
      issues.push({ file: file.path, rule: "has-export", severity: "warn", message: "Module has no export" });
    }
    return issues;
  },
};
