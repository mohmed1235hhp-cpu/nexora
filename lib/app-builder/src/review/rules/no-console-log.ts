import type { FileArtifact } from "../../ai/schemas/common";
import type { Issue } from "../ReviewLoop";

export const NoConsoleLogRule = {
  name: "no-console-log",
  check(file: FileArtifact): Issue[] {
    const issues: Issue[] = [];
    const c = file.content;
    if (/console\.log\s*\(/.test(c)) {
      issues.push({ file: file.path, rule: "no-console-log", severity: "warn", message: "Remove console.log" });
    }
    return issues;
  },
};
