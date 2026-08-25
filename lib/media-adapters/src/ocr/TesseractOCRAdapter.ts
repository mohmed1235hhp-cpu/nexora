import { createWorker } from "tesseract.js";
import type {
  AdapterContext,
  IMediaAdapter,
  OCRInput,
  OCROutput,
} from "@workspace/media-core";

export class TesseractOCRAdapter implements IMediaAdapter<OCRInput, OCROutput> {
  readonly meta = {
    id: "tesseract-ocr",
    provider: "tesseract" as const,
    kind: "ocr" as const,
    qualityTier: "cheap" as const,
    capabilities: ["offline", "multi-language", "arabic"],
  };

  async execute(input: OCRInput, ctx: AdapterContext): Promise<OCROutput> {
    const worker = await createWorker(input.language, 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && typeof m.progress === "number") {
          ctx.onProgress?.(m.progress, m.status);
        }
      },
    });
    try {
      const { data } = await worker.recognize(input.imageUrl);
      return {
        provider: "tesseract",
        text: data.text,
        confidence: Math.max(0, Math.min(1, (data.confidence ?? 0) / 100)),
        blocks: (data.blocks ?? []).map((b) => ({
          text: b.text,
          bbox: [b.bbox.x0, b.bbox.y0, b.bbox.x1, b.bbox.y1] as [number, number, number, number],
          confidence: (b.confidence ?? 0) / 100,
        })),
      };
    } finally {
      await worker.terminate();
    }
  }

  async estimateCost() {
    return { currency: "USD" as const, estimated: 0 };
  }

  async healthCheck() {
    return { ok: true, latencyMs: 0 };
  }
}
