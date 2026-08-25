import type { HealthSnapshot } from "../health/types.js";
import type { MetricSample } from "../metrics/types.js";
import type { LogRecord } from "../logging/types.js";
export interface DashboardData {
  readonly generatedAt: number;
  readonly health: HealthSnapshot;
  readonly metrics: readonly MetricSample[];
  readonly recentLogs: readonly LogRecord[];
}
