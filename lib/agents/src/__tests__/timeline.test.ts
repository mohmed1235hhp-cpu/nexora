import { describe, it, expect } from "vitest";
import { ExecutionTimeline } from "../timeline/ExecutionTimeline";
import { TimelineEmitter } from "../timeline/TimelineEmitter";
import { phaseIcons } from "../timeline/phaseIcons";

describe("ExecutionTimeline", () => {
  it("collects and formats events", () => {
    const t = new ExecutionTimeline();
    t.addEvent({ id: "e1", phase: "coding", status: "in-progress", timestamp: 1 });
    t.addEvent({ id: "e1", phase: "coding", status: "completed", timestamp: 100 });
    const formatted = t.getFormatted();
    expect(formatted[0]).toContain(phaseIcons.coding);
  });
});

describe("TimelineEmitter", () => {
  it("notifies subscribers", () => {
    const emitter = new TimelineEmitter();
    const received: number[] = [];
    emitter.subscribe(e => received.push(e.timestamp));
    emitter.emit({ id: "x", phase: "coding", status: "in-progress", timestamp: 42 });
    expect(received).toEqual([42]);
  });
});
