import type { MediaBlob } from "../../types/media.js";
export interface TTSParams { text: string; voice?: string; language?: string; speed?: number; }
export interface STTParams { audio: MediaBlob; language?: string; }
export interface IVoiceProvider {
  readonly name: string;
  tts(p: TTSParams): Promise<MediaBlob>;
  stt(p: STTParams): Promise<{ text: string; language?: string; confidence?: number }>;
}
