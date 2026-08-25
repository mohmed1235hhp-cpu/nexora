export interface ProviderDashboardStats {
  providerId: string;
  requests: number;
  successes: number;
  failures: number;
  averageLatencyMs: number;
  totalCostUsd: number;
  lastError?: string;
  lastUsedAt?: string;
}

export interface DashboardSnapshot {
  requests: number;
  successes: number;
  failures: number;
  averageLatencyMs: number;
  successRate: number;
  failureRate: number;
  totalCostUsd: number;
  providers: ProviderDashboardStats[];
}
