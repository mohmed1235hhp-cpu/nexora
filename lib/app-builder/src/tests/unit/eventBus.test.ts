import { describe, it, expect } from "vitest";
import { EventBus } from "../../core/events/EventBus";
describe("EventBus", () => {
  it("emits to subscribers", () => {
    const bus = new EventBus();
    let n = 0; bus.on("x", () => { n++; }); bus.emit("x", null);
    expect(n).toBe(1);
  });
});
