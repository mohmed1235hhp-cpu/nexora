/**
 * AES-256-GCM envelope encryption for at-rest secrets (AI provider keys, etc.)
 *
 * KEY MANAGEMENT
 *  - MASTER_ENCRYPTION_KEY: base64-encoded 32 raw bytes (set via env; fail-fast at boot).
 *  - Prod: source the master key from AWS KMS / GCP KMS / HashiCorp Vault at boot.
 *
 * FORMAT (base64url, single string):  v1.<iv>.<ciphertext>.<authTag>
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash, timingSafeEqual } from "node:crypto";

const ALG = "aes-256-gcm";
const IV_LEN = 12;
const KEY_LEN = 32;

function loadMasterKey(): Buffer {
  const raw = process.env.MASTER_ENCRYPTION_KEY;
  if (!raw) throw new Error("MASTER_ENCRYPTION_KEY is required (base64, 32 bytes)");
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LEN) throw new Error(`MASTER_ENCRYPTION_KEY must decode to ${KEY_LEN} bytes`);
  return key;
}

let cachedKey: Buffer | null = null;
function key() { return (cachedKey ??= loadMasterKey()); }

function b64u(b: Buffer) { return b.toString("base64url"); }
function b64uDecode(s: string) { return Buffer.from(s, "base64url"); }

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${b64u(iv)}.${b64u(ct)}.${b64u(tag)}`;
}

export function decrypt(token: string): string {
  const [version, iv, ct, tag] = token.split(".");
  if (version !== "v1" || !iv || !ct || !tag) throw new Error("Malformed ciphertext");
  const decipher = createDecipheriv(ALG, key(), b64uDecode(iv));
  decipher.setAuthTag(b64uDecode(tag));
  return Buffer.concat([decipher.update(b64uDecode(ct)), decipher.final()]).toString("utf8");
}

/** SHA-256 hex; use for hashing session tokens before DB storage. */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a); const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
