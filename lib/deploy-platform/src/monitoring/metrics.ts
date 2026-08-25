export interface DeployMetrics {
  readonly currentBuilds: number;
  readonly queueSize: number;
  readonly workers: number;
  readonly averageBuildMs: number;
  readonly successRate: number;
  readonly failureRate: number;
}
