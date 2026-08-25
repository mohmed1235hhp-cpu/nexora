import type { MediaRef } from "./media.js";
export interface BaseResult<T = unknown> {
  ok: true;
  output: T;
  media?: MediaRef[];
  durationMs: number;
  provider?: string;
  agent?: string;
}
export interface ErrorResult {
  ok: false;
  code: string;
  message: string;
  cause?: unknown;
}
export type Result<T = unknown> = BaseResult<T> | ErrorResult;
