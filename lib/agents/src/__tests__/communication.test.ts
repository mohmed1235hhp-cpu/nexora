import { describe, it, expect } from "vitest";
import { CommunicationHub } from "../orchestrator/CommunicationHub";

describe("CommunicationHub", () => {
  it("publishes to subscribers by topic", () => {
    const hub = new CommunicationHub();
    const received: string[] = [];
    hub.subscribe("test-topic", msg => received.push(String(msg.payload)));
    hub.publish({ id: "1", from: "a", topic: "test-topic", payload: "hello", timestamp: 0 });
    expect(received).toEqual(["hello"]);
  });

  it("supports wildcard subscribers", () => {
    const hub = new CommunicationHub();
    let count = 0;
    hub.subscribe("*", () => count++);
    hub.publish({ id: "1", from: "a", topic: "any", payload: 1, timestamp: 0 });
    hub.publish({ id: "2", from: "a", topic: "other", payload: 2, timestamp: 0 });
    expect(count).toBe(2);
  });
});
