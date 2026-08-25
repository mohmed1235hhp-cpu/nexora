import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getQueue, setQueue, enqueue, process as processQueue } from "../index";
import type { Job, QueueDriver } from "../index";

// The module keeps a module-level singleton (`_driver`). Reset it between
// tests via setQueue so each test gets a fresh MemoryDriver instance.
function freshDriver(): QueueDriver {
  setQueue(undefined as unknown as QueueDriver); // force re-creation via getQueue()
  return getQueue();
}

describe("MemoryDriver (default queue driver)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    freshDriver();
  });

  afterEach(async () => {
    await getQueue().close();
    vi.useRealTimers();
  });

  it("enqueues a job and reports queue depth", async () => {
    const driver = getQueue();
    await driver.enqueue("email", { to: "a@b.com" });
    expect(await driver.depth("email")).toBe(1);
  });

  it("processes an enqueued job via a registered handler", async () => {
    const driver = getQueue();
    const seen: Job[] = [];
    await driver.process("email", async (job) => {
      seen.push(job);
    });
    await driver.enqueue("email", { to: "a@b.com" });

    await vi.advanceTimersByTimeAsync(100);

    expect(seen).toHaveLength(1);
    expect(seen[0]!.payload).toEqual({ to: "a@b.com" });
    expect(seen[0]!.queue).toBe("email");
    expect(await driver.depth("email")).toBe(0);
  });

  it("retries a failing job with exponential backoff until it succeeds", async () => {
    const driver = getQueue();
    let calls = 0;
    await driver.process(
      "notifications",
      async () => {
        calls++;
        if (calls < 3) throw new Error("transient failure");
      },
      1,
    );
    await driver.enqueue("notifications", {}, { attempts: 5, backoffMs: 10 });

    // Drain through several retry cycles.
    for (let i = 0; i < 10; i++) {
      await vi.advanceTimersByTimeAsync(500);
    }

    expect(calls).toBe(3);
    expect(await driver.depth("notifications")).toBe(0);
  });

  it("gives up after exhausting retry attempts and drops the job", async () => {
    const driver = getQueue();
    let calls = 0;
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await driver.process(
      "contest",
      async () => {
        calls++;
        throw new Error("always fails");
      },
      1,
    );
    await driver.enqueue("contest", {}, { attempts: 2, backoffMs: 5 });

    for (let i = 0; i < 10; i++) {
      await vi.advanceTimersByTimeAsync(200);
    }

    expect(calls).toBe(2);
    expect(await driver.depth("contest")).toBe(0);
    errSpy.mockRestore();
  });

  it("deduplicates jobs sharing an idempotency key", async () => {
    const driver = getQueue();
    const id1 = await driver.enqueue("analytics", { n: 1 }, { idempotencyKey: "same-key" });
    const id2 = await driver.enqueue("analytics", { n: 2 }, { idempotencyKey: "same-key" });

    expect(id1).not.toMatch(/^dedup:/);
    expect(id2).toBe("dedup:same-key");
    expect(await driver.depth("analytics")).toBe(1);
  });

  it("runs higher-priority (lower number) jobs first", async () => {
    const driver = getQueue();
    const order: number[] = [];
    await driver.process(
      "generic",
      async (job) => {
        order.push((job.payload as { n: number }).n);
      },
      1,
    );
    await driver.enqueue("generic", { n: 3 }, { priority: 10 });
    await driver.enqueue("generic", { n: 1 }, { priority: 1 });
    await driver.enqueue("generic", { n: 2 }, { priority: 5 });

    await vi.advanceTimersByTimeAsync(200);

    expect(order).toEqual([1, 2, 3]);
  });

  it("delays execution until delayMs has elapsed", async () => {
    const driver = getQueue();
    const seen: number[] = [];
    await driver.process("generic", async () => {
      seen.push(Date.now());
    });
    await driver.enqueue("generic", {}, { delayMs: 1000 });

    await vi.advanceTimersByTimeAsync(50);
    expect(seen).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1000);
    expect(seen).toHaveLength(1);
  });

  it("close() clears queues and handlers", async () => {
    const driver = getQueue();
    await driver.enqueue("email", {});
    await driver.close();
    expect(await driver.depth("email")).toBe(0);
  });
});

describe("enqueue()/process() convenience wrappers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    freshDriver();
  });

  afterEach(async () => {
    await getQueue().close();
    vi.useRealTimers();
  });

  it("delegate to the active driver singleton", async () => {
    const seen: unknown[] = [];
    await processQueue("website-build", async (job) => {
      seen.push(job.payload);
    });
    await enqueue("website-build", { site: "x" });

    await vi.advanceTimersByTimeAsync(100);

    expect(seen).toEqual([{ site: "x" }]);
  });
});

describe("setQueue()", () => {
  it("overrides the active driver with a test double", async () => {
    const calls: Array<[string, unknown]> = [];
    const fake: QueueDriver = {
      async enqueue(queue, payload) {
        calls.push([queue, payload]);
        return "fake-id";
      },
      async process() {},
      async depth() {
        return 0;
      },
      async close() {},
    };
    setQueue(fake);

    const id = await enqueue("image", { url: "x" });

    expect(id).toBe("fake-id");
    expect(calls).toEqual([["image", { url: "x" }]]);
  });
});
