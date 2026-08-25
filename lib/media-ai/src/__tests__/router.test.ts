import { describe, expect, it } from "vitest";
import { MediaAIRouter } from "../router/MediaAIRouter.js";
import type { IImageProvider } from "../shared/interfaces/index.js";

const stub: IImageProvider = {
  name: "stub",
  async generate() { return { kind: "image", mime: "image/png", bytes: new Uint8Array() }; },
  async edit()     { return { kind: "image", mime: "image/png", bytes: new Uint8Array() }; },
};

describe("MediaAIRouter", () => {
  it("throws when no image provider is registered", () => {
    const r = new MediaAIRouter();
    expect(() => r.pickImage()).toThrow(/no image provider/);
  });
  it("returns registered image provider", () => {
    const r = new MediaAIRouter();
    r.register("image", stub);
    expect(r.pickImage().name).toBe("stub");
  });
});
