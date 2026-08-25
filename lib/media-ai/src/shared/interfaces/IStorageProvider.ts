import type { MediaBlob, MediaRef } from "../../types/media.js";
export interface IStorageProvider {
  readonly name: string;
  put(blob: MediaBlob): Promise<MediaRef>;
  get(id: string): Promise<MediaBlob | null>;
  delete(id: string): Promise<void>;
}
