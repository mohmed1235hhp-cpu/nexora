import type { FileArtifact } from "../../ai/schemas/common";
import type { Issue } from "../ReviewLoop";

export function autoFix(files: FileArtifact[], issues: Issue[]): FileArtifact[] {
  const byFile = new Map<string, Issue[]>();
  for (const i of issues) {
    const arr = byFile.get(i.file) ?? [];
    arr.push(i); byFile.set(i.file, arr);
  }
  return files.map((f) => {
    let c = f.content;
    const fileIssues = byFile.get(f.path) ?? [];
    for (const i of fileIssues) {
      if (i.rule === "has-newline" && !c.endsWith("\n")) c += "\n";
      if (i.rule === "no-console-log") c = c.replace(/console\.log\([^)]*\);?/g, "");
      if (i.rule === "no-var") c = c.replace(/\bvar\s+/g, "let ");
      if (i.rule === "no-todo") c = c.replace(/\bTODO\b[^\n]*/g, "");
    }
    return { ...f, content: c };
  });
}
