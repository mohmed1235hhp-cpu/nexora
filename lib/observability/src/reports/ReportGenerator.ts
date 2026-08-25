import type { Report, ReportInput } from "./types.js";

export class ReportGenerator {
  generate(input: ReportInput): Report {
    const md = this.toMarkdown(input);
    const json: Record<string, unknown> = {
      period: input.period, kind: input.kind, generatedAt: input.generatedAt,
      health: input.health, metrics: input.metrics, analytics: input.analytics, extra: input.extra,
    };
    return {
      id: `${input.kind}-${input.period}-${input.generatedAt}`,
      period: input.period, kind: input.kind, generatedAt: input.generatedAt,
      markdown: md, json,
    };
  }

  private toMarkdown(i: ReportInput): string {
    const lines: string[] = [];
    lines.push(`# ${i.kind[0]!.toUpperCase() + i.kind.slice(1)} report (${i.period})`);
    lines.push("", `_Generated: ${new Date(i.generatedAt).toISOString()}_`, "");
    if (i.health) {
      lines.push("## Health", `- state: **${i.health.state}**`,
        `- healthy: ${i.health.summary.healthy}, degraded: ${i.health.summary.degraded}, unhealthy: ${i.health.summary.unhealthy}`, "");
    }
    if (i.metrics && i.metrics.length) {
      lines.push("## Top metrics");
      for (const m of i.metrics.slice(0, 20)) lines.push(`- ${m.name} = ${m.value}`);
      lines.push("");
    }
    if (i.analytics) {
      lines.push("## Analytics", `- events: ${i.analytics.count}`);
      const kinds = Object.entries(i.analytics.byKind).slice(0, 10);
      for (const [k, v] of kinds) lines.push(`  - ${k}: ${v}`);
      lines.push("");
    }
    if (i.extra) {
      lines.push("## Extra");
      for (const [k, v] of Object.entries(i.extra)) lines.push(`- ${k}: ${v}`);
    }
    return lines.join("\n");
  }
}
