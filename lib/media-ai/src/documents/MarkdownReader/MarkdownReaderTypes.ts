// Documents / MarkdownReader — request/response types
import type { MediaBlob, MediaRef } from "../../types/media.js";
import type { BaseRequest } from "../../types/request.js";
export interface MarkdownReaderRequest extends BaseRequest {
  input?: MediaBlob | MediaRef | string;
  options?: Record<string, unknown>;
}
export interface MarkdownReaderResponse {
  output?: MediaBlob | MediaRef | string | Record<string, unknown>;
  info?: Record<string, unknown>;
}
