import { describe, it, expect, vi } from "vitest";
import {
  HealthRegistry,
  time,
  onError,
  reportError,
  metrics,
} from "../index";

describe("HealthRegistry", () => {
  it("liveness() always reports up", async () => {
    const reg = new HealthRegistry();
    expect(await reg.liveness()).toEqual({ status: "up" });
  });

  it("readiness() reports up when all checks pass", async () => {
    const reg = new HealthRegistry();
    reg.register("db", async () => ({ status: "up" }));
    reg.register("redis", async () => ({ status: "up" }));

    const result = await reg.readiness();

    expect(result.status).toBe("up");
    expect(result.checks.db?.status).toBe("up");
    expect(result.checks.redis?.status).toBe("up");
  });

  it("readiness() reports down when a critical check is down", async () => {
    const reg = new HealthRegistry();
    reg.register("db", async () => ({ status: "down", detail: "connection refused" }), {
      critical: true,
    });

    const result = await reg.readiness();

    expect(result.status).toBe("down");
    expect(result.checks.db?.status).toBe("down");
  });

  it("readiness() reports degraded (not down) when a non-critical check fails", async () => {
    const reg = new HealthRegistry();
    reg.register("db", async () => ({ status: "up" }));
    reg.register("optional-cache", async () => ({ status: "down" }), { critical: false });

    const result = await reg.readiness();

    expect(result.status).toBe("degraded");
  });

  it("readiness() treats a thrown error as a down check", async () => {
    const reg = new HealthRegistry();
    reg.register("flaky", async () => {
      throw new Error("boom");
    });

    const result = await reg.readiness();

    expect(result.status).toBe("down");
    expect(result.checks.flaky?.status).toBe("down");
    expect(result.checks.flaky?.detail).toBe("boom");
  });
});

describe("metrics registry", () => {
  it("counter() accumulates increments per label set", () => {
    const c = metrics.counter("test_requests_total", "test help text");
    c.inc({ route: "/a" });
    c.inc({ route: "/a" });
    c.inc({ route: "/b" });

    const output = c.expose();
    expect(output).toContain('test_requests_total{route="/a"} 2');
    expect(output).toContain('test_requests_total{route="/b"} 1');
  });

  it("gauge() reports the last set value per label set", () => {
    const g = metrics.gauge("test_queue_depth", "depth");
    g.set({ queue: "email" }, 3);
    g.set({ queue: "email" }, 7);

    expect(g.expose()).toContain('test_queue_depth{queue="email"} 7');
  });

  it("histogram() buckets observations and tracks sum/count", () => {
    const h = metrics.histogram("test_duration_ms", "duration");
    h.observe({}, 5);
    h.observe({}, 50);
    h.observe({}, 5000);

    const output = h.expose();
    expect(output).toContain("test_duration_ms_count{} 3");
    expect(output).toContain("test_duration_ms_sum{} 5055");
  });

  it("counter()/gauge()/histogram() return the same instance for a repeated name", () => {
    expect(metrics.counter("same_counter")).toBe(metrics.counter("same_counter"));
  });
});

describe("time()", () => {
  it("records the elapsed duration and returns the wrapped result", async () => {
    const h = metrics.histogram("test_time_helper_ms", "helper");
    const result = await time(h, {}, async () => "done");

    expect(result).toBe("done");
    expect(h.expose()).toContain("test_time_helper_ms_count{} 1");
  });

  it("still records duration when the wrapped function throws", async () => {
    const h = metrics.histogram("test_time_helper_err_ms", "helper");
    await expect(
      time(h, {}, async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow("fail");

    expect(h.expose()).toContain("test_time_helper_err_ms_count{} 1");
  });
});

describe("onError()/reportError()", () => {
  it("notifies registered listeners and logs to console.error", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const received: unknown[] = [];
    onError((e) => received.push(e));

    reportError({ err: new Error("oops"), where: "test" });

    expect(received).toHaveLength(1);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
