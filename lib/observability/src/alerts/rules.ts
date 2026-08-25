import type { AlertRule } from "./types.js";

export const highErrorRateRule: AlertRule = {
  name: "high-error-rate", kind: "critical", severity: "critical",
  evaluate({ metrics }) {
    if (!metrics) return undefined;
    const errors = metrics.filter(m => m.name.includes("errors") && m.kind === "counter").reduce((a, m) => a + m.value, 0);
    if (errors < 20) return undefined;
    return { id: `err-${Date.now()}`, ts: Date.now(), kind: "critical", severity: "critical",
      title: "High error rate", message: `errors=${errors}`, data: { errors } };
  },
};

export const unhealthyServiceRule: AlertRule = {
  name: "unhealthy-service", kind: "critical", severity: "critical",
  evaluate({ health }) {
    if (!health) return undefined;
    if (health.state !== "unhealthy") return undefined;
    const failing = Object.entries(health.checks).filter(([, r]) => r.state !== "healthy").map(([n]) => n).join(",");
    return { id: `hlth-${health.ts}`, ts: health.ts, kind: "critical", severity: "critical",
      title: "Service unhealthy", message: `failing=${failing || "unknown"}`, data: { failing } };
  },
};

export const queueSaturationRule: AlertRule = {
  name: "queue-saturation", kind: "queue", severity: "warning",
  evaluate({ metrics }) {
    if (!metrics) return undefined;
    const depth = metrics.find(m => m.name.includes("queue") && m.name.includes("depth"));
    if (!depth || depth.value < 500) return undefined;
    return { id: `q-${Date.now()}`, ts: Date.now(), kind: "queue", severity: "warning",
      title: "Queue saturated", message: `depth=${depth.value}`, data: { depth: depth.value } };
  },
};

export const defaultRules: readonly AlertRule[] = [highErrorRateRule, unhealthyServiceRule, queueSaturationRule];
