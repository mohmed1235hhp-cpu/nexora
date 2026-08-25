import type { MediaBlob } from "../../types/media.js";
export interface OCRResult { text: string; blocks?: Array<{ text: string; bbox?: [number, number, number, number] }>; language?: string; }
export interface IOCRProvider {
  readonly name: string;
  recognize(image: MediaBlob, opts?: { language?: string }): Promise<OCRResult>;
}
