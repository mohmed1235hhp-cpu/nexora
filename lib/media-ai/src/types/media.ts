export type MediaKind = "image" | "audio" | "video" | "document" | "text" | "binary";
export type MimeType = string;
export interface MediaBlob {
  kind: MediaKind;
  mime: MimeType;
  bytes: Uint8Array;
  filename?: string;
}
export interface MediaRef {
  id: string;
  kind: MediaKind;
  mime: MimeType;
  size: number;
  url?: string;
  filename?: string;
}
