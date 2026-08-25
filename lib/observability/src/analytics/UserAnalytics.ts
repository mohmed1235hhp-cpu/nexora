import { BaseAnalytics } from "./BaseAnalytics.js";
import type { AnalyticsSink } from "./types.js";
export class UserAnalytics extends BaseAnalytics {
  constructor(sink: AnalyticsSink) { super(sink, "user"); }
  track(kind: string, data?: Record<string, string | number | boolean>, userId?: string): void { this.write(kind, data, userId); }
}
