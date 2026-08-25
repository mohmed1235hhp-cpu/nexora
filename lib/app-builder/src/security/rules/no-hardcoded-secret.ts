import type { FileArtifact } from "../../ai/schemas/common";
import type { SecurityFinding } from "../SecurityPass";

export const NoHardcodedSecretRule = {
  name: "no-hardcoded-secret",
  description: "Blocks hardcoded API keys, secrets, or tokens",
  check(f: FileArtifact): SecurityFinding[] {
    const out: SecurityFinding[] = [];
    if (/(api[_-]?key|secret|token)\s*[:=]\s*[\"\x27][A-Za-z0-9_\-]{20,}[\"\x27]/i.test(f.content)) {
      out.push({ file: f.path, rule: "no-hardcoded-secret", severity: "high", message: "Possible hardcoded secret" });
    }
    return out;
  },
};
