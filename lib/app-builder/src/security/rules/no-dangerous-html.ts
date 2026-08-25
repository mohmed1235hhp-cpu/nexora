import type { FileArtifact } from "../../ai/schemas/common";
import type { SecurityFinding } from "../SecurityPass";

export const NoDangerousHtmlRule = {
  name: "no-dangerous-html",
  description: "Blocks React dangerouslySetInnerHTML",
  check(f: FileArtifact): SecurityFinding[] {
    const out: SecurityFinding[] = [];
    if (/dangerouslySetInnerHTML/.test(f.content)) {
      out.push({ file: f.path, rule: "no-dangerous-html", severity: "medium", message: "dangerouslySetInnerHTML detected" });
    }
    return out;
  },
};
