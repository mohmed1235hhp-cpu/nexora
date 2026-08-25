import { describe, it, expect } from "vitest";
import { imageGenerateSchema, ttsSchema, sttSchema, ocrSchema, documentParseSchema, uploadSchema } from "@workspace/media-core";

describe("adapter contracts (schemas)", () => {
  it("image", () => expect(imageGenerateSchema.parse({ prompt: "cat", size: "1024x1024", n: 1 })).toBeTruthy());
  it("tts",   () => expect(ttsSchema.parse({ text: "hi", voice: "alloy", format: "mp3" })).toBeTruthy());
  it("stt",   () => expect(sttSchema.parse({ audioUrl: "https://x/y.mp3", language: "en" })).toBeTruthy());
  it("ocr",   () => expect(ocrSchema.parse({ imageUrl: "https://x/y.png", language: "eng" })).toBeTruthy());
  it("doc",   () => expect(documentParseSchema.parse({ fileUrl: "https://x/y.pdf", mimeType: "application/pdf" })).toBeTruthy());
  it("upload",() => expect(uploadSchema.parse({ key: "k/1", contentType: "image/png", sizeBytes: 100 })).toBeTruthy());
  it("rejects bad image", () => expect(() => imageGenerateSchema.parse({ prompt: "" })).toThrow());
});
