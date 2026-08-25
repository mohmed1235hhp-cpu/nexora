import type { MetricRegistry } from "../MetricRegistry.js";
import type { MetricSample } from "../types.js";

function esc(v: string | number | boolean): string { return String(v).replace(/["\\]/g, "\\$&"); }
function line(s: MetricSample): string {
  const tags = s.tags ? "{" + Object.entries(s.tags).map(([k, v]) => `${k}="${esc(v as string | number | boolean)}"`).join(",") + "}" : "";
  return `${s.name}${tags} ${s.value} ${s.ts}`;
}
export class PrometheusExporter {
  constructor(private readonly reg: MetricRegistry) {}
  export(): string {
    const seenHelp = new Set<string>();
    const out: string[] = [];
    for (const m of this.reg.list()) {
      if (!seenHelp.has(m.name)) {
        out.push(`# HELP ${m.name} ${m.help ?? ""}`);
        out.push(`# TYPE ${m.name} ${m.kind}`);
        seenHelp.add(m.name);
      }
      for (const s of m.collect()) out.push(line(s));
    }
    return out.join("\n") + "\n";
  }
}
