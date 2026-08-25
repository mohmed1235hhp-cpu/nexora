import { describe, it, expect } from "vitest";
import { MetricRegistry, PrometheusExporter, JsonExporter } from "../src/metrics/index.js";

describe("metrics", () => {
  it("counter/gauge/histogram/summary all collect", () => {
    const r = new MetricRegistry();
    r.counter("requests").inc(2);
    r.gauge("temp").set(21);
    r.histogram("lat").observe(15);
    r.summary("s").observe(1);
    const samples = r.collect();
    expect(samples.length).toBeGreaterThan(0);
    expect(new JsonExporter(r).export()).toContain("samples");
    expect(new PrometheusExporter(r).export()).toContain("# HELP requests");
  });
});
