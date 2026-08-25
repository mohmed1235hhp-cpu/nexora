/**
 * Media Core — unified interfaces and types for all media adapters.
 *
 * Every adapter (image / voice / OCR / documents / storage) implements
 * `IMediaAdapter` and is invoked by the API server or workers through the
 * `AIRouter`. The router owns provider selection, retry, fallback, and
 * telemetry — adapters stay dumb and provider-specific.
 */

export interface AdapterMeta {
  readonly id: string;
  readonly provider: "openai" | "gemini" | "tesseract" | "local" | "aws";
  readonly kind: "image" | "voice-tts" | "voice-stt" | "ocr" | "document" | "storage";
  readonly qualityTier: "flagship" | "balanced" | "cheap";
  readonly capabilities: readonly string[];
}

export interface HealthResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface CostEstimate {
  currency: "USD";
  estimated: number;
  breakdown?: Record<string, number>;
}

export interface AdapterContext {
  requestId: string;
  userId?: string;
  signal?: AbortSignal;
  /** Called by the adapter to report incremental progress (0..1). */
  onProgress?: (progress: number, note?: string) => void;
}

export interface IMediaAdapter<Input, Output> {
  readonly meta: AdapterMeta;
  execute(input: Input, ctx: AdapterContext): Promise<Output>;
  estimateCost(input: Input): Promise<CostEstimate>;
  healthCheck(): Promise<HealthResult>;
}

export type AdapterFactory<Input, Output> = (
  config: Record<string, unknown>,
) => IMediaAdapter<Input, Output>;
