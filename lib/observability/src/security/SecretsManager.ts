import type { SecretsProvider } from "./types.js";

/** Ordered provider chain with in-memory cache. */
export class SecretsManager {
  private readonly cache = new Map<string, string>();
  constructor(private readonly providers: readonly SecretsProvider[]) {}

  async get(key: string): Promise<string | undefined> {
    if (this.cache.has(key)) return this.cache.get(key);
    for (const p of this.providers) {
      const v = await p.get(key);
      if (v !== undefined) { this.cache.set(key, v); return v; }
    }
    return undefined;
  }
  async require(key: string): Promise<string> {
    const v = await this.get(key);
    if (v === undefined) throw new Error(`missing secret: ${key}`);
    return v;
  }
  invalidate(key?: string): void { if (key) this.cache.delete(key); else this.cache.clear(); }
}

export class InMemorySecretsProvider implements SecretsProvider {
  readonly name = "memory";
  constructor(private readonly data: Record<string, string> = {}) {}
  get(k: string) { return this.data[k]; }
  has(k: string) { return k in this.data; }
  list() { return Object.keys(this.data); }
  set(k: string, v: string) { this.data[k] = v; }
}

export class EnvSecretsProvider implements SecretsProvider {
  readonly name = "env";
  constructor(private readonly env: Record<string, string | undefined> = (globalThis as any)?.process?.env ?? {}) {}
  get(k: string) { return this.env[k]; }
  has(k: string) { return this.env[k] !== undefined; }
}
