import type { Alert, AlertChannel } from "./types.js";
import { EventBus } from "../core/EventBus.js";

export class LogAlertChannel implements AlertChannel {
  readonly name = "log";
  constructor(private readonly log: (msg: string, alert: Alert) => void = (m, a) => console.warn(`[alert:${a.severity}]`, m, a.data ?? {})) {}
  send(alert: Alert): void { this.log(`${alert.title} — ${alert.message}`, alert); }
}

export class EventBusAlertChannel implements AlertChannel {
  readonly name = "event-bus";
  constructor(public readonly bus: EventBus<Alert> = new EventBus<Alert>()) {}
  async send(alert: Alert): Promise<void> { await this.bus.publish(alert); }
}

/** Interface-only webhook channel; caller supplies the transport (fetch). */
export class WebhookAlertChannel implements AlertChannel {
  readonly name = "webhook";
  constructor(private readonly url: string, private readonly fetcher: (u: string, init: RequestInit) => Promise<Response> = (globalThis as any).fetch) {}
  async send(alert: Alert): Promise<void> {
    if (!this.fetcher) return;
    try {
      await this.fetcher(this.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(alert) });
    } catch (err) { try { console.error("[alerts.WebhookAlertChannel]", err); } catch {} }
  }
}
