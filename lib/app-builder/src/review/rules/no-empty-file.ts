import type { FileArtifact } from "../../ai/schemas/common";
import type { Issue } from "../ReviewLoop";

export const NoEmptyFileRule = {
  name: "no-empty-file",
  check(file: FileArtifact): Issue[] {
    const issues: Issue[] = [];
    const c = file.content;
    if (!/\S/.test(c)) {
      issues.push({ file: file.path, rule: "no-empty-file", severity: "error", message: "File is empty" });
    }
    return issues;
  },
};
