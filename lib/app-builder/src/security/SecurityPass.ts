import type { AgentContext } from "../agents/BaseAgent";
import type { FileArtifact } from "../ai/schemas/common";
import { ALL_SECURITY_RULES } from "./rules";

export interface SecurityFinding {
  file: string;
  rule: string;
  severity: "low" | "medium" | "high";
  message: string;
}

export async function runSecurityPass(
  ctx: AgentContext,
  files: FileArtifact[],
): Promise<{ findings: SecurityFinding[]; score: number }> {
  const findings: SecurityFinding[] = [];
  for (const rule of ALL_SECURITY_RULES) {
    for (const f of files) findings.push(...rule.check(f));
  }
  const score = Math.max(0, 100 - findings.length * 2);
  ctx.log("info", `security: ${findings.length} findings, score=${score}`);
  return { findings, score };
}
