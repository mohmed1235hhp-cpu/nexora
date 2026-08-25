import type { LogFilter, LogRecord } from "../types.js";
import { TokenBucket } from "../../core/Ratelimit.js";
export class RateLimitFilter implements LogFilter {
  private readonly bucket: TokenBucket;
  constructor(perSec: number, capacity = perSec) {
    this.bucket = new TokenBucket(capacity, perSec);
  }
  accept(_r: LogRecord): boolean { return this.bucket.tryConsume(1); }
}
