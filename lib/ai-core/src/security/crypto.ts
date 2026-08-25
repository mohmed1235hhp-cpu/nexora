/**
 * AES-256-GCM decrypt — intentionally format-compatible with
 * artifacts/api-server/src/lib/crypto.ts (`v1.<iv>.<ciphertext>.<authTag>`,
 * base64url, same MASTER_ENCRYPTION_KEY env var). Duplicated here instead of
 * imported so @workspace/ai-core stays a standalone package that doesn't
 * reach into an application artifact — only the on-disk format is shared.
 */
import { createDecipheriv, createCipheriv, randomBytes } from "node:crypto";

const ALG = "aes-256-gcm";
const IV_LEN = 12;
const KEY_LEN = 32;

let cachedKey: Buffer | null = null;

function loadMasterKey(): Buffer {
  const raw = process.env.MASTER_ENCRYPTION_KEY;
  if (!raw) throw new Error("MASTER_ENCRYPTION_KEY is required (base64, 32 bytes)");
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LEN) throw new Error(`MASTER_ENCRYPTION_KEY must decode to ${KEY_LEN} bytes`);
  return key;
}

function key(): Buffer {
  return (cachedKey ??= loadMasterKey());
}

function b64u(b: Buffer) {
  return b.toString("base64url");
}
function b64uDecode(s: string) {
  return Buffer.from(s, "base64url");
}

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
