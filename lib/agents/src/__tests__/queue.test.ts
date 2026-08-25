import { describe, it, expect } from "vitest";
import { TaskQueue } from "../execution/TaskQueue";
import type { AgentTask } from "../types/task.types";

const makeTask = (id: string, priority: AgentTask["priority"] = "normal"): AgentTask => ({
  id, capability: "coding", input: {}, priority, dependsOn: [],
});

describe("TaskQueue", () => {
  it("enqueues and dequeues", () => {
    const q = new TaskQueue();
    q.enqueue(makeTask("t1"));
    expect(q.size()).toBe(1);
    expect(q.dequeue()?.task.id).toBe("t1");
  });

  it("prioritizes critical tasks", () => {
    const q = new TaskQueue();
    q.enqueue(makeTask("low", "low"));
    q.enqueue(makeTask("critical", "critical"));
    q.enqueue(makeTask("normal", "normal"));
    expect(q.dequeue()?.task.id).toBe("critical");
  });
});
