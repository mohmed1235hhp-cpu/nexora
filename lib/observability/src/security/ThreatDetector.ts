import { EventBus } from "../core/EventBus.js";
import type { ThreatEvent, ThreatKind } from "./types.js";
import { systemClock, type Clock } from "../core/Clock.js";

export interface ThreatRule {
  readonly name: string;
  match(input: { source: string; path?: string; body?: string; headers?: Record<string, string> }): ThreatEvent | undefined;
}

/** Regex/rule engine + rate anomaly detector. */
export class ThreatDetector {
  readonly events = new EventBus<ThreatEvent>();
  private readonly rates = new Map<string, number[]>();
  constructor(private readonly rules: readonly ThreatRule[] = defaultRules(), private readonly clock: Clock = systemClock) {}

  inspect(input: { source: string; path?: string; body?: string; headers?: Record<string, string> }): readonly ThreatEvent[] {
    const found: ThreatEvent[] = [];
    for (const r of this.rules) { const e = r.match(input); if (e) found.push(e); }
    // rate anomaly: >100 hits/10s from a single source
    const now = this.clock.now();
    const arr = (this.rates.get(input.source) ?? []).filter(t => now - t < 10_000);
    arr.push(now);
    this.rates.set(input.source, arr);
    if (arr.length > 100) {
      found.push({ kind: "rate-anomaly", ts: now, source: input.source,
        message: `rate anomaly: ${arr.length} events / 10s`, severity: "high", data: { count: arr.length } });
    }
    for (const e of found) void this.events.publish(e);
    return found;
  }
}

function defaultRules(): readonly ThreatRule[] {
  const inject = /(union\s+select|<script\b|\bon\w+=|javascript:|\.\.\/|\bDROP\s+TABLE\b)/i;
  return [{
    name: "basic-injection",
    match: (i) => {
      const hay = `${i.path ?? ""}\n${i.body ?? ""}`;
      if (!inject.test(hay)) return undefined;
      return { kind: "injection", ts: Date.now(), source: i.source, message: "suspicious payload", severity: "high" };
    },
  }];
}
