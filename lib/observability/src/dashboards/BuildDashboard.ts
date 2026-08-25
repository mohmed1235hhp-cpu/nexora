import type { BuildAnalytics } from "../analytics/BuildAnalytics.js";
export class BuildDashboard {
  constructor(private readonly builds: BuildAnalytics) {}
  async render() { return { generatedAt: Date.now(), aggregate: await this.builds.aggregate() }; }
}
