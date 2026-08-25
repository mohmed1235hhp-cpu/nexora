import type { AiAnalytics } from "../analytics/AiAnalytics.js";
export class AiDashboard {
  constructor(private readonly ai: AiAnalytics) {}
  async render() { return { generatedAt: Date.now(), aggregate: await this.ai.aggregate() }; }
}
