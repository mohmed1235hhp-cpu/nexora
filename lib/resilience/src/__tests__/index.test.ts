import { describe, it, expect, vi } from "vitest";
import { retry, timeout, CircuitBreaker, makeFailover } from "../index";

describe("retry()", () => {
  it("returns the result immediately on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await retry(fn, { attempts: 3, baseMs: 1 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on a retryable error and eventually succeeds", async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls < 3) {
        const err: any = new Error("temporary");
        err.status = 503;
        throw err;
      }
      return "recovered";
    });

    const result = await retry(fn, { attempts: 5, baseMs: 1, maxMs: 5, jitter: false });

    expect(result).toBe("recovered");
    expect(calls).toBe(3);
  });

  it("throws immediately for a non-retryable error", async () => {
    const err = new Error("not retryable");
    const fn = vi.fn().mockRejectedValue(err);
    const isRetryable = vi.fn().mockReturnValue(false);

    await expect(retry(fn, { attempts: 5, isRetryable })).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws the last error once attempts are exhausted", async () => {
    const err: any = new Error("still failing");
    err.status = 503; // default-retryable
    const fn = vi.fn().mockRejectedValue(err);

    await expect(retry(fn, { attempts: 3, baseMs: 1, maxMs: 2 })).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("calls onRetry with the error, attempt number, and delay", async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls < 2) throw new Error("retryable network error");
      return "ok";
    });
    const onRetry = vi.fn();

    await retry(fn, { attempts: 3, baseMs: 1, jitter: false, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0]![1]).toBe(1); // attempt number
  });

  it("stops retrying when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const fn = vi.fn();

    await expect(retry(fn, { signal: controller.signal })).rejects.toThrow("aborted");
    expect(fn).not.toHaveBeenCalled();
  });

  it("treats common network error codes as retryable by default", async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls < 2) {
        const err: any = new Error("connection reset");
        err.code = "ECONNRESET";
        throw err;
      }
      return "ok";
    });

    const result = await retry(fn, { attempts: 3, baseMs: 1 });
    expect(result).toBe("ok");
  });
});

describe("timeout()", () => {
  it("resolves with the inner promise's value when it settles in time", async () => {
    const result = await timeout(Promise.resolve("fast"), 100);
    expect(result).toBe("fast");
  });

  it("rejects once the timeout elapses before the promise settles", async () => {
    const never = new Promise(() => {});
    await expect(timeout(never, 10, "slow-op")).rejects.toThrow(/slow-op timed out after 10ms/);
  });
});

describe("CircuitBreaker", () => {
  it("starts closed and stays closed while calls succeed", async () => {
    const cb = CircuitBreaker.create();
    await cb.exec(async () => "ok");
    expect(cb.status).toBe("closed");
  });

  it("opens after reaching the failure threshold", async () => {
    const cb = CircuitBreaker.create({ failureThreshold: 2 });
    const failing = async () => {
      throw new Error("fail");
    };

    await expect(cb.exec(failing)).rejects.toThrow("fail");
    expect(cb.status).toBe("closed");
    await expect(cb.exec(failing)).rejects.toThrow("fail");
    expect(cb.status).toBe("open");
  });

  it("rejects immediately with circuit_open while open", async () => {
    const cb = CircuitBreaker.create({ failureThreshold: 1, openMs: 10_000 });
    await expect(cb.exec(async () => { throw new Error("fail"); })).rejects.toThrow();

    const fn = vi.fn();
    await expect(cb.exec(fn)).rejects.toThrow("circuit_open");
    expect(fn).not.toHaveBeenCalled();
  });

  it("transitions to half-open after openMs and closes again on success", async () => {
    vi.useFakeTimers();
    const cb = CircuitBreaker.create({ failureThreshold: 1, successThreshold: 1, openMs: 100 });
    await expect(cb.exec(async () => { throw new Error("fail"); })).rejects.toThrow();
    expect(cb.status).toBe("open");

    vi.advanceTimersByTime(150);

    await cb.exec(async () => "recovered");
    expect(cb.status).toBe("closed");
    vi.useRealTimers();
  });
});

describe("makeFailover()", () => {
  it("returns the result from the first healthy provider", async () => {
    const invoke = vi.fn(async (p: string) => `${p}-result`);
    const call = makeFailover(
      [{ name: "primary", provider: "primary" }, { name: "backup", provider: "backup" }],
      invoke,
    );

    const result = await call("input");

    expect(result).toBe("primary-result");
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("falls through to the next provider when the first fails", async () => {
    const invoke = vi.fn(async (p: string) => {
      if (p === "primary") throw new Error("primary down");
      return `${p}-result`;
    });
    const call = makeFailover(
      [{ name: "primary", provider: "primary" }, { name: "backup", provider: "backup" }],
      invoke,
    );

    const result = await call("input");

    expect(result).toBe("backup-result");
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it("throws once every provider has failed", async () => {
    const invoke = vi.fn(async () => {
      throw new Error("down");
    });
    const call = makeFailover(
      [{ name: "a", provider: "a" }, { name: "b", provider: "b" }],
      invoke,
    );

    await expect(call("input")).rejects.toThrow("down");
  });
});
