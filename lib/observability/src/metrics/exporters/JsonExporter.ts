import type { MetricRegistry } from "../MetricRegistry.js";
export class JsonExporter {
  constructor(private readonly reg: MetricRegistry) {}
  export(): string { return JSON.stringify({ ts: Date.now(), samples: this.reg.collect() }); }
}
