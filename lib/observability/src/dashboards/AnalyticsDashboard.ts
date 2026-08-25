import type { AnalyticsSink } from "../analytics/types.js";
export class AnalyticsDashboard {
  constructor(private readonly sinks: readonly AnalyticsSink[]) {}
  async render() {
    const perSink = await Promise.all(this.sinks.map(async s => ({ name: s.name, events: (await s.query()).length })));
    return { generatedAt: Date.now(), perSink };
  }
}
