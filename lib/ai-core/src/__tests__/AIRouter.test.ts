import { describe, it, expect } from "vitest";
import { AIRouter, TaskType, AIErrorCode } from "../index";

describe("AIRouter", () => {
  it("routes text-chat to the NoopProvider and returns provider-not-configured", async () => {
    const router = new AIRouter();
    const res = await router.execute({
      task: TaskType.TextChat,
      input: { message: "hi" },
      meta: { userId: "u1" },
    });
    expect(res.ok).toBe(false);
    expect(res.errorCode).toBe(AIErrorCode.ProviderNotConfigured);
    expect(res.providerId).toBe("noop");
  });

  it("handles every registered TaskType", async () => {
    const router = new AIRouter();
    for (const task of Object.values(TaskType)) {
      if (task === TaskType.Embedding) continue; // no handler registered for embeddings
      const res = await router.execute({ task, input: {}, meta: { userId: "u1" } });
      expect(res.providerId).toBe("noop");
    }
  });

  it("assigns a requestId when missing", async () => {
    const router = new AIRouter();
    const res = await router.execute({ task: TaskType.TextChat, input: {} });
    expect(res.requestId).toBeTypeOf("string");
  });

  it("supports streaming via stream()", async () => {
    const router = new AIRouter();
    const events: string[] = [];
    await router.stream(
      { task: TaskType.TextChat, input: {} },
      (ev) => events.push(ev.type),
    );
    expect(events[0]).toBe("start");
    expect(events[events.length - 1]).toBe("end");
  });
});
