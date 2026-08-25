import type { FileArtifact } from "../../ai/schemas/common";
import type { SecurityFinding } from "../SecurityPass";

export const NoHttpRule = {
  name: "no-http",
  description: "Blocks plain http:// URLs (require https)",
  check(f: FileArtifact): SecurityFinding[] {
    const out: SecurityFinding[] = [];
    if (/http:\/\/(?!localhost|127\.0\.0\.1)/.test(f.content)) {
      out.push({ file: f.path, rule: "no-http", severity: "low", message: "Non-https URL detected" });
    }
    return out;
  },
};
