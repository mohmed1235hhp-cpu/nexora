import { BaseAnalytics } from "./BaseAnalytics.js";
import type { AnalyticsSink } from "./types.js";
export class BuildAnalytics extends BaseAnalytics {
  constructor(sink: AnalyticsSink) { super(sink, "build"); }
  track(kind: string, data?: Record<string, string | number | boolean>, userId?: string): void { this.write(kind, data, userId); }
}
