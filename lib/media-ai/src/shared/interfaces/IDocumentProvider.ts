import type { MediaBlob } from "../../types/media.js";
export interface DocumentText { pages: string[]; text: string; metadata?: Record<string, unknown>; }
export interface IDocumentProvider {
  readonly name: string;
  supports(mime: string): boolean;
  parse(file: MediaBlob): Promise<DocumentText>;
}
