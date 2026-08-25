import { describe, it, expect } from "vitest";
import {
  bootstrapPlatform,
  adaptLegacyAgent,
  type LegacyAgent,
} from "../index";

function makeAgent(id: string, capabilities: string[], impl?: (i: unknown) => unknown): LegacyAgent {
  return {
    id,
    capabilities,
    async execute(input) {
      if (impl) return impl(input);
      return { text: `ran ${id}`, tokens: 1 };
    },
  };
}

describe("platform-core Phase 1", () => {
  it("routes a chat request through AI Core → orchestrator → agent", async () => {
    const p = bootstrapPlatform();
    p.agentManager.register(adaptLegacyAgent(makeAgent("chat-agent", ["chat.reply"])));

    const res = await p.ai.handle({
      requestId: "r1",
      sessionId: "s1",
      input: "hello world",
    });

    expect(res.ok).toBe(true);
    expect(res.text).toContain("ran chat-agent");
    expect(res.usage.tasksExecuted).toBe(1);
    expect(res.usage.agentsInvolved).toContain("chat-agent");
  });

  it("splits app.build into layered tasks executed in parallel groups", async () => {
    const p = bootstrapPlatform();
    const caps = [
      "planning.plan",
      "architecture.design",
      "image.generate",
      "content.write",
      "code.generate",
      "code.test",
      "deploy.package",
      "deploy.deliver",
    ];
    for (const c of caps) {
      p.agentManager.register(adaptLegacyAgent(makeAgent(`agent-${c}`, [c])));
    }
    const res = await p.ai.handle({
      requestId: "r2",
      sessionId: "s2",
      input: "please build application for me",
    });
    expect(res.ok).toBe(true);
    expect(res.usage.tasksExecuted).toBe(8);
    expect(res.usage.agentsInvolved.length).toBe(8);
  });

  it("falls back to backup agent when primary throws", async () => {
    const p = bootstrapPlatform();
    p.agentManager.register(
      adaptLegacyAgent(
        {
          id: "primary",
          capabilities: ["chat.reply"],
          async execute() {
            throw new Error("boom");
          },
        },
        { backupAgentId: "backup" },
      ),
    );
    p.agentManager.register(adaptLegacyAgent(makeAgent("backup", ["chat.reply"], () => ({ text: "backup ok" }))));

    const res = await p.ai.handle({ requestId: "r3", sessionId: "s3", input: "hi" });
    expect(res.text).toContain("backup ok");
  });

  it("degrades gracefully when no agent is available", async () => {
    const p = bootstrapPlatform();
    const res = await p.ai.handle({ requestId: "r4", sessionId: "s4", input: "hi" });
    expect(res.ok).toBe(false);
    expect(res.warnings?.length ?? 0).toBeGreaterThan(0);
  });

  it("isolates sandbox memory between agents", async () => {
    const p = bootstrapPlatform();
    const a = p.sandboxes.getOrCreate("a", "s");
    const b = p.sandboxes.getOrCreate("b", "s");
    a.setMemory("k", "A");
    b.setMemory("k", "B");
    expect(a.getMemory("k")).toBe("A");
    expect(b.getMemory("k")).toBe("B");
  });

  it("rate-limits after capacity is exhausted", async () => {
    const p = bootstrapPlatform();
    p.agentManager.register(adaptLegacyAgent(makeAgent("chat-agent", ["chat.reply"])));
    // Default capacity is 30; issue 31 rapid requests
    let limited = 0;
    for (let i = 0; i < 35; i++) {
      const res = await p.ai.handle({ requestId: `r${i}`, sessionId: "same", input: "ping" });
      if (res.warnings?.includes("rate_limited")) limited += 1;
    }
    expect(limited).toBeGreaterThan(0);
  });

  it("monitors calls and produces dashboard snapshot", async () => {
    const p = bootstrapPlatform();
    p.agentManager.register(adaptLegacyAgent(makeAgent("chat-agent", ["chat.reply"])));
    await p.ai.handle({ requestId: "m1", sessionId: "m", input: "hi" });
    const snap = p.monitor.snapshot();
    expect(snap.totalRequests).toBe(1);
    expect(snap.agents.find((a) => a.agentId === "chat-agent")?.totalCalls).toBe(1);
  });
});
