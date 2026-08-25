import type { FinalReport } from "../FinalReport";
export function toMarkdown(r: FinalReport): string {
  return [
    `# Build Report — ${r.jobId}`,
    ``,
    `**Readiness:** ${r.readinessScore}/100`,
    ``,
    `## Counts`,
    `- Files: ${r.counts.files}`,
    `- Tests: ${r.counts.tests}`,
    `- Screens: ${r.counts.screens}`,
    `- Components: ${r.counts.components}`,
    `- Services: ${r.counts.services}`,
    `- Errors: ${r.counts.errors}`,
    `- Warnings: ${r.counts.warnings}`,
    ``,
    `## Security (${r.security.score}/100)`,
    ...r.security.findings.map((f) => `- [${f.severity}] ${f.file}: ${f.message}`),
    ``,
    `## Performance (${r.perf.score}/100)`,
    ...r.perf.hints.map((h) => `- [${h.severity}] ${h.file}: ${h.hint}`),
    ``,
    `## Artifacts`,
    ...r.artifacts.map((a) => `- ${a}`),
  ].join("\n");
}
