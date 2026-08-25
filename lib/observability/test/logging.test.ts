import { describe, it, expect } from "vitest";
import { LoggerFactory, MemorySink, Logger, LevelFilter, RedactionFilter } from "../src/logging/index.js";

describe("logging/Logger", () => {
  it("routes to sinks and respects level", async () => {
    const mem = new MemorySink();
    const log = new Logger({ sinks: [mem], minLevel: "info" });
    await log.debug("dropped");
    await log.info("kept");
    expect(mem.size()).toBe(1);
    expect(mem.snapshot()[0].message).toBe("kept");
  });

  it("redacts sensitive keys", async () => {
    const mem = new MemorySink();
    const log = new Logger({ sinks: [mem], filters: [new LevelFilter("debug"), new RedactionFilter()] });
    await log.info("hello", { password: "abc", user: "ok" });
    expect(mem.snapshot()[0].data?.password).toBe("[REDACTED]");
    expect(mem.snapshot()[0].data?.user).toBe("ok");
  });

  it("factory attaches memory sink", async () => {
    const f = new LoggerFactory({ withConsole: false });
    const l = f.create({ minLevel: "info" });
    await l.info("x");
    expect(f.memory.size()).toBe(1);
  });
});
