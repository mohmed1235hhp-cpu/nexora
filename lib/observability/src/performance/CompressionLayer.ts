import { gzipSync, brotliCompressSync, gunzipSync, brotliDecompressSync, constants } from "node:zlib";
export type CompressionAlgo = "gzip" | "br";

export class CompressionLayer {
  compress(data: string | Uint8Array, algo: CompressionAlgo = "gzip"): Uint8Array {
    const buf = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
    return algo === "gzip" ? gzipSync(buf) : brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } });
  }
  decompress(data: Uint8Array, algo: CompressionAlgo = "gzip"): Uint8Array {
    const buf = Buffer.from(data);
    return algo === "gzip" ? gunzipSync(buf) : brotliDecompressSync(buf);
  }
  ratio(original: number, compressed: number): number { return original === 0 ? 0 : compressed / original; }
}
