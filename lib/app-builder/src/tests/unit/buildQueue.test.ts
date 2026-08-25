import { describe, it, expect } from "vitest";
import { BuildQueue } from "../../pipeline/BuildQueue";
describe("BuildQueue", () => {
  it("enqueues and returns next", () => {
    const q = new BuildQueue();
    q.enqueue({ id: "a", spec: {}, createdAt: 0, status: "queued" });
    expect(q.next()?.id).toBe("a");
  });
});
