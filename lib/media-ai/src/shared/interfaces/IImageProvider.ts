import type { MediaBlob } from "../../types/media.js";
export interface ImageGenParams { prompt: string; width?: number; height?: number; style?: string; seed?: number; }
export interface ImageEditParams { source: MediaBlob; instruction: string; mask?: MediaBlob; }
export interface IImageProvider {
  readonly name: string;
  generate(p: ImageGenParams): Promise<MediaBlob>;
  edit(p: ImageEditParams): Promise<MediaBlob>;
}
