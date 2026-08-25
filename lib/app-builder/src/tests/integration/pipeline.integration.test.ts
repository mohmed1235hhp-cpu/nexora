import { describe, it, expect } from "vitest";
import { BuildQueue } from "../../pipeline/BuildQueue";
import { StatusTracker } from "../../pipeline/status/StatusTracker";
describe("pipeline integration (shell)", () => {
  it("wires queue + status", () => {
    const q = new BuildQueue();
    const s = new StatusTracker();
    q.enqueue({ id: "x", spec: {}, createdAt: 0, status: "queued" });
    s.set("x", "queued");
    expect(q.get("x")?.status).toBe("queued");
    expect(s.get("x")?.stage).toBe("queued");
  });
});
