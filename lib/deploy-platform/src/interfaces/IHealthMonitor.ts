export interface HealthSample { readonly ts: number; readonly ok: boolean; readonly detail?: string; }
export interface IHealthMonitor<TId = string> {
  probe(id: TId): Promise<HealthSample>;
  recent(id: TId, limit?: number): readonly HealthSample[];
}
