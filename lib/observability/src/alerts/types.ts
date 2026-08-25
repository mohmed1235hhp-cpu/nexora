import type { HealthSnapshot } from "../health/types.js";
import type { MetricSample } from "../metrics/types.js";

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertKind = "critical" | "performance" | "security" | "worker" | "queue";

export interface Alert {
  readonly id: string;
  readonly ts: number;
  readonly kind: AlertKind;
  readonly severity: AlertSeverity;
  readonly title: string;
  readonly message: string;
  readonly data?: Readonly<Record<string, string | number | boolean>>;
}

export interface AlertChannel {
  readonly name: string;
  send(alert: Alert): void | Promise<void>;
}

export interface AlertRule {
  readonly name: string;
  readonly kind: AlertKind;
  readonly severity: AlertSeverity;
  evaluate(input: { metrics?: readonly MetricSample[]; health?: HealthSnapshot }): Alert | undefined;
}
