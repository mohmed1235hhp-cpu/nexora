import { describe, it, expect } from "vitest";
import { RecoveryOrchestrator, RestartFailedWorker, ClearQueue, RetryFailedTasks } from "../src/recovery/index.js";

describe("RecoveryOrchestrator", () => {
  it("restarts dead workers", async () => {
    let restarted = 0;
    const workers = [{ id: "w1", isAlive: () => false, restart: async () => { restarted++; } }];
    const orch = new RecoveryOrchestrator().register(new RestartFailedWorker(() => workers));
    const r = await orch.trigger({ reason: "worker-failed", attempt: 1 });
    expect(r[0]!.outcome).toBe("recovered"); expect(restarted).toBe(1);
  });
  it("clears queue on overflow and retries tasks", async () => {
    let cleared = 0;
    const q = { name: "q", clear: async () => { cleared = 5; return 5; } };
    const tasks = [{ id: "t", failed: true, retry: async () => { /* ok */ } }];
    const orch = new RecoveryOrchestrator().register(new ClearQueue(() => q)).register(new RetryFailedTasks(() => tasks));
    const r1 = await orch.trigger({ reason: "queue-overflow", attempt: 1 });
    expect(r1[0]!.outcome).toBe("recovered"); expect(cleared).toBe(5);
    const r2 = await orch.trigger({ reason: "tasks-failed", attempt: 1 });
    expect(r2[0]!.outcome).toBe("recovered");
  });
});
