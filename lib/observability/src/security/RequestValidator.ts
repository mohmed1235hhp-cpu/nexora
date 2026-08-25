import { createHmac, timingSafeEqual } from "node:crypto";

export interface SignedRequest {
  readonly body: string;
  readonly signature: string;
  readonly timestampMs?: number;
  readonly secret: string;
  readonly algorithm?: "sha256" | "sha512";
  readonly maxSkewMs?: number;
}

export class RequestValidator {
  verify(req: SignedRequest): { valid: boolean; reason?: string } {
    if (req.timestampMs !== undefined) {
      const skew = Math.abs(Date.now() - req.timestampMs);
      if (skew > (req.maxSkewMs ?? 5 * 60_000)) return { valid: false, reason: "timestamp skew" };
    }
    const algo = req.algorithm ?? "sha256";
    const expected = createHmac(algo, req.secret).update(req.body).digest("hex");
    try {
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(req.signature.replace(/^sha(?:256|512)=/, ""), "hex");
      if (a.length !== b.length) return { valid: false, reason: "signature length" };
      return { valid: timingSafeEqual(a, b) };
    } catch { return { valid: false, reason: "signature parse" }; }
  }
}
