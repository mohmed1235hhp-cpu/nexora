import { db, aiGovernanceProvidersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { decrypt } from "./crypto";
import type { ProviderDescriptor } from "../types/provider.types";

/**
 * ApiKeyVault — resolves the API key for a provider without any application
 * code ever touching a raw secret.
 *
 * Resolution order (SECURITY: never expose keys, server-side only):
 *   1. `ai_governance_providers` DB row for this provider id — the same
 *      table the admin dashboard manages (encrypted at rest via
 *      MASTER_ENCRYPTION_KEY, so a key can be rotated from the admin panel
 *      with zero deploys).
 *   2. Same table matched by the provider's underlying vendor (several
 *      provider ids share one vendor credential, e.g. "openai-images" and
 *      "whisper" both bill through OpenAI).
 *   3. `process.env[descriptor.apiKeyEnv]` as a deploy-time fallback.
 *
 * Results are cached in-memory for a short TTL so a chat burst doesn't
 * trigger a DB round trip per token — this is a pure read-through cache,
 * never a place secrets are logged or persisted outside memory.
 */

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { value: string | null; expiresAt: number }>();

/** Maps a granular provider id to the vendor row name used in the DB table. */
function vendorAliasesFor(descriptor: ProviderDescriptor): string[] {
  const aliases = new Set<string>([descriptor.id]);
  const env = descriptor.apiKeyEnv ?? "";
  if (env.startsWith("ANTHROPIC_")) aliases.add("anthropic");
  if (env.startsWith("OPENAI_")) aliases.add("openai");
  if (env.startsWith("GEMINI_")) aliases.add("gemini");
  if (env.startsWith("GOOGLE_")) aliases.add("google");
  return Array.from(aliases);
}

async function lookupInDb(aliases: string[]): Promise<string | null> {
  for (const alias of aliases) {
    try {
      const rows = await db
        .select({ apiKeyEncrypted: aiGovernanceProvidersTable.apiKeyEncrypted })
        .from(aiGovernanceProvidersTable)
        .where(and(eq(aiGovernanceProvidersTable.name, alias), eq(aiGovernanceProvidersTable.isActive, true)))
        .limit(1);
      if (rows.length && rows[0].apiKeyEncrypted) {
        return decrypt(rows[0].apiKeyEncrypted);
      }
    } catch {
      // DB unavailable or key undecryptable — fall through to env var / next alias
      // rather than throwing, so a single misconfigured row can't take a
      // whole capability chain down; the caller fails over to the next provider.
    }
  }
  return null;
}

export async function getApiKey(descriptor: ProviderDescriptor): Promise<string | null> {
  const cached = cache.get(descriptor.id);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const aliases = vendorAliasesFor(descriptor);
  let value = await lookupInDb(aliases);
  if (!value && descriptor.apiKeyEnv) {
    value = process.env[descriptor.apiKeyEnv] ?? null;
  }

  cache.set(descriptor.id, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/** Drops all cached keys — call after an admin rotates a key so it takes effect immediately. */
export function invalidateApiKeyCache(): void {
  cache.clear();
}
