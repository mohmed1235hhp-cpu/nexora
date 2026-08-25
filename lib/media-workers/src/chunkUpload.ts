/**
 * Chunked upload helper — resumable, checksum-verified multi-part uploads.
 *
 * Persistence lives in the `media_upload_chunks` table added by migration
 * `0002_media_scalability.sql`; final assembly writes to the configured
 * storage adapter (S3-compatible in production).
 *
 * Client flow:
 *   1. POST /uploads/start           → { uploadId, chunkSize }
 *   2. PUT  /uploads/:id/:index      (repeat for every chunk, in any order)
 *   3. POST /uploads/:id/complete    → { assetId, cdnUrl }
 *
 * This module exposes the pure server-side logic; the HTTP layer wraps it.
 */

export interface ChunkRecord {
  uploadId: string;
  userId: string;
  chunkIndex: number;
  chunkSize: number;
  checksum: string;
  storageKey: string;
}

export interface ChunkStore {
  saveChunk(record: ChunkRecord): Promise<void>;
  listChunks(uploadId: string): Promise<ChunkRecord[]>;
  deleteChunks(uploadId: string): Promise<void>;
}

export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;  // 5 MiB — S3 minimum part
export const MAX_UPLOAD_SIZE    = 5 * 1024 * 1024 * 1024; // 5 GiB

export function isValidChunkIndex(idx: number, totalChunks: number): boolean {
  return Number.isInteger(idx) && idx >= 0 && idx < totalChunks && totalChunks <= 10_000;
}

/** Verify all chunks are present, contiguous, and match declared count. */
export async function verifyComplete(store: ChunkStore, uploadId: string, expected: number): Promise<{ ok: boolean; missing: number[] }> {
  const chunks = await store.listChunks(uploadId);
  const seen = new Set(chunks.map(c => c.chunkIndex));
  const missing: number[] = [];
  for (let i = 0; i < expected; i++) if (!seen.has(i)) missing.push(i);
  return { ok: missing.length === 0, missing };
}
