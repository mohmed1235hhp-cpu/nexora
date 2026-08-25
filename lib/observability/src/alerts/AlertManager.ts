import type { HealthSnapshot } from "../health/types.js";
import type { MetricSample } from "../metrics/types.js";
import { EventBus } from "../core/EventBus.js";
import type { Alert, AlertChannel, AlertRule } from "./types.js";

export class AlertManager {
  readonly bus = new EventBus<Alert>();
  private readonly channels: AlertChannel[] = [];
  private readonly rules: AlertRule[] = [];
  private readonly recent: Alert[] = [];

  addChannel(c: AlertChannel): this { this.channels.push(c); return this; }
  addRule(r: AlertRule): this { this.rules.push(r); return this; }
  recentAlerts(): readonly Alert[] { return [...this.recent]; }

  async emit(alert: Alert): Promise<void> {
    this.recent.push(alert); if (this.recent.length > 500) this.recent.shift();
    await this.bus.publish(alert);
    await Promise.all(this.channels.map(async c => { try { await c.send(alert); } catch (e) { try { console.error("[AlertManager]", c.name, e); } catch {} } }));
  }
  async evaluate(input: { metrics?: readonly MetricSample[]; health?: HealthSnapshot }): Promise<readonly Alert[]> {
    const out: Alert[] = [];
    for (const r of this.rules) { const a = r.evaluate(input); if (a) { out.push(a); await this.emit(a); } }
    return out;
  }
}
