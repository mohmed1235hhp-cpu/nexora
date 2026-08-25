import type { FileArtifact } from "../../ai/schemas/common";
import type { Issue } from "../ReviewLoop";

export const NoTodoRule = {
  name: "no-todo",
  check(file: FileArtifact): Issue[] {
    const issues: Issue[] = [];
    const c = file.content;
    if (/\bTODO\b/.test(c)) {
      issues.push({ file: file.path, rule: "no-todo", severity: "info", message: "TODO comment present" });
    }
    return issues;
  },
};
