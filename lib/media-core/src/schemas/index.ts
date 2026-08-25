import { z } from "zod";

/* ------------------------------ Image ------------------------------ */

export const ImageGenerateInput = z.object({
  prompt: z.string().min(1).max(4000),
  size: z.enum(["512x512", "1024x1024", "1024x1792", "1792x1024"]).default("1024x1024"),
  n: z.number().int().min(1).max(4).default(1),
  style: z.enum(["natural", "vivid"]).optional(),
  referenceImageUrl: z.string().url().optional(),
});
export type ImageGenerateInput = z.infer<typeof ImageGenerateInput>;

export const ImageEditInput = z.object({
  prompt: z.string().min(1).max(4000),
  imageUrl: z.string().url(),
  maskUrl: z.string().url().optional(),
  size: z.enum(["512x512", "1024x1024"]).default("1024x1024"),
});
export type ImageEditInput = z.infer<typeof ImageEditInput>;

export const ImageOutput = z.object({
  images: z.array(z.object({ url: z.string().url(), b64: z.string().optional() })),
  provider: z.string(),
  model: z.string(),
});
export type ImageOutput = z.infer<typeof ImageOutput>;

/* ------------------------------ Voice ------------------------------ */

export const TTSInput = z.object({
  text: z.string().min(1).max(20000),
  voice: z.string().default("alloy"),
  format: z.enum(["mp3", "wav", "ogg"]).default("mp3"),
  speed: z.number().min(0.25).max(4).default(1),
});
export type TTSInput = z.infer<typeof TTSInput>;

export const TTSOutput = z.object({
  audioUrl: z.string(),
  format: z.string(),
  durationMs: z.number().optional(),
  provider: z.string(),
});
export type TTSOutput = z.infer<typeof TTSOutput>;

export const STTInput = z.object({
  audioUrl: z.string().url(),
  language: z.string().optional(),
  prompt: z.string().optional(),
});
export type STTInput = z.infer<typeof STTInput>;

export const STTOutput = z.object({
  text: z.string(),
  language: z.string().optional(),
  segments: z
    .array(z.object({ start: z.number(), end: z.number(), text: z.string() }))
    .optional(),
  provider: z.string(),
});
export type STTOutput = z.infer<typeof STTOutput>;

/* ------------------------------- OCR ------------------------------- */

export const OCRInput = z.object({
  imageUrl: z.string().url(),
  language: z.string().default("eng+ara"),
});
export type OCRInput = z.infer<typeof OCRInput>;

export const OCROutput = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
  blocks: z
    .array(
      z.object({
        text: z.string(),
        bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
        confidence: z.number(),
      }),
    )
    .optional(),
  provider: z.string(),
});
export type OCROutput = z.infer<typeof OCROutput>;

/* ---------------------------- Documents ---------------------------- */

export const DocumentParseInput = z.object({
  fileUrl: z.string().url(),
  mimeType: z.string(),
});
export type DocumentParseInput = z.infer<typeof DocumentParseInput>;

export const DocumentParseOutput = z.object({
  text: z.string(),
  pages: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  provider: z.string(),
});
export type DocumentParseOutput = z.infer<typeof DocumentParseOutput>;

/* ----------------------------- Storage ----------------------------- */

export const UploadInput = z.object({
  key: z.string().min(1),
  contentType: z.string(),
  sizeBytes: z.number().int().positive(),
});
export type UploadInput = z.infer<typeof UploadInput>;

export const UploadOutput = z.object({
  uploadUrl: z.string().url(),
  method: z.literal("PUT"),
  key: z.string(),
  publicUrl: z.string().url().optional(),
  expiresIn: z.number(),
});
export type UploadOutput = z.infer<typeof UploadOutput>;
