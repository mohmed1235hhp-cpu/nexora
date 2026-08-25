import { describe, expect, it } from "vitest";
import { enforceFileSize, enforceMime, looksSuspicious } from "../security/index.js";

describe("security", () => {
  it("rejects oversize files", () => {
    expect(() => enforceFileSize(11, 10)).toThrow();
    expect(() => enforceFileSize(5, 10)).not.toThrow();
  });
  it("rejects disallowed mime", () => {
    expect(() => enforceMime("application/x-msdownload", ["image/png"])).toThrow();
  });
  it("flags suspicious filenames", () => {
    expect(looksSuspicious("payload.exe")).toBe(true);
    expect(looksSuspicious("photo.png")).toBe(false);
  });
});
