import type { HealthState, HealthResult, HealthSnapshot } from "./types.js";

function rank(s: HealthState): number {
  return s === "unhealthy" ? 3 : s === "degraded" ? 2 : s === "unknown" ? 1 : 0;
}
export function aggregate(
  results: Readonly<Record<string, HealthResult>>,
  criticals: ReadonlySet<string>,
  ts: number,
): HealthSnapshot {
  let worst: HealthState = "healthy";
  const summary = { healthy: 0, degraded: 0, unhealthy: 0, unknown: 0 };
  for (const [name, r] of Object.entries(results)) {
    summary[r.state] += 1;
    const effective: HealthState = criticals.has(name) && r.state === "degraded" ? "unhealthy" : r.state;
    if (rank(effective) > rank(worst)) worst = effective;
  }
  return { state: worst, ts, checks: results, summary };
}
