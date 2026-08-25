import type { FileArtifact } from "../../ai/schemas/common";
import type { Issue } from "../ReviewLoop";

export const HasNewlineRule = {
  name: "has-newline",
  check(file: FileArtifact): Issue[] {
    const issues: Issue[] = [];
    const c = file.content;
    if (!/\n$/.test(c)) {
      issues.push({ file: file.path, rule: "has-newline", severity: "info", message: "File should end with a newline" });
    }
    return issues;
  },
};
