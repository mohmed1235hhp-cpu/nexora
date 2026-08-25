import type { FileArtifact } from "../../ai/schemas/common";
import type { Issue } from "../ReviewLoop";

export const NoHardcodedColorRule = {
  name: "no-hardcoded-color",
  check(file: FileArtifact): Issue[] {
    const issues: Issue[] = [];
    const c = file.content;
    if (/#[0-9a-fA-F]{6}\b/.test(c)) {
      issues.push({ file: file.path, rule: "no-hardcoded-color", severity: "warn", message: "Use a design token instead of hardcoded color" });
    }
    return issues;
  },
};
