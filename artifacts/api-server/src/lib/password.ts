/**
 * Password hashing with Argon2id (recommended by OWASP 2024).
 * Backwards-compatible: verifies legacy bcrypt hashes and re-hashes on next login.
 */
import argon2 from "argon2";
import bcrypt from "bcrypt";
import { env } from "./env";

const ARGON2_PREFIX = "$argon2";
const BCRYPT_PREFIX_RE = /^\$2[aby]?\$/;

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    memoryCost: env.ARGON2_MEMORY_KB,
    timeCost: env.ARGON2_ITERATIONS,
    parallelism: env.ARGON2_PARALLELISM,
  });
}

/**
 * Verifies a password against either an Argon2id or legacy bcrypt hash.
 * Returns `{ valid, needsRehash }`. Callers should re-hash and persist when
 * `needsRehash` is true so the user is migrated to Argon2 seamlessly.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (hash.startsWith(ARGON2_PREFIX)) {
    const valid = await argon2.verify(hash, password);
    // Rehash when parameters have been strengthened since the hash was created.
    const needsRehash = valid && argon2.needsRehash(hash, {
      memoryCost: env.ARGON2_MEMORY_KB,
      timeCost: env.ARGON2_ITERATIONS,
      parallelism: env.ARGON2_PARALLELISM,
    });
    return { valid, needsRehash };
  }
  if (BCRYPT_PREFIX_RE.test(hash)) {
    const valid = await bcrypt.compare(password, hash);
    // Always migrate away from bcrypt on next successful login.
    return { valid, needsRehash: valid };
  }
  return { valid: false, needsRehash: false };
}
