import type { FileArtifact } from "../../ai/schemas/common";
import type { SecurityFinding } from "../SecurityPass";

export const NoLocalStorageTokenRule = {
  name: "no-localStorage-token",
  description: "Blocks storing auth tokens in localStorage",
  check(f: FileArtifact): SecurityFinding[] {
    const out: SecurityFinding[] = [];
    if (/localStorage\.setItem\([^)]*token/i.test(f.content)) {
      out.push({ file: f.path, rule: "no-localStorage-token", severity: "medium", message: "Auth token saved to localStorage" });
    }
    return out;
  },
};
