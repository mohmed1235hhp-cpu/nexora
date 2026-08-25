/**
 * Search Manager: internet search + trusted sources + citations + caching.
 * Providers are injected; the manager only handles cache + trust scoring.
 */
import type { Citation } from "../types";

export interface SearchQuery {
  readonly q: string;
  readonly limit?: number;
  readonly locale?: string;
  readonly freshnessDays?: number;
}

export interface SearchHit {
  readonly title: string;
  readonly url: string;
  readonly snippet: string;
  readonly source: string;
  readonly publishedAt?: string;
  readonly score?: number;
}

export interface ISearchProvider {
  readonly name: string;
  search(query: SearchQuery): Promise<readonly SearchHit[]>;
}

export interface SearchManagerConfig {
  readonly trustedDomains: readonly string[];
  readonly cacheTtlMs: number;
}

export const defaultSearchConfig: SearchManagerConfig = {
  trustedDomains: [
    "wikipedia.org",
    "arxiv.org",
    "nature.com",
    "nih.gov",
    "who.int",
    "un.org",
    "gov",
    "edu",
    "mdn.io",
    "developer.mozilla.org",
    "docs.python.org",
    "openai.com",
    "google.com",
    "microsoft.com",
  ],
  cacheTtlMs: 5 * 60 * 1000,
};

export class SearchManager {
  private readonly cache = new Map<string, { hits: readonly SearchHit[]; exp: number }>();
  constructor(
    private readonly providers: readonly ISearchProvider[],
    private readonly cfg: SearchManagerConfig = defaultSearchConfig,
  ) {}

  private cacheKey(q: SearchQuery): string {
    return `${q.q}::${q.limit ?? 10}::${q.locale ?? ""}::${q.freshnessDays ?? ""}`;
  }

  isTrusted(url: string): boolean {
    try {
      const host = new URL(url).hostname;
      return this.cfg.trustedDomains.some((d) => host === d || host.endsWith(`.${d}`));
    } catch {
      return false;
    }
  }

  async search(query: SearchQuery): Promise<{ hits: readonly SearchHit[]; citations: readonly Citation[]; fromCache: boolean }> {
    const key = this.cacheKey(query);
    const cached = this.cache.get(key);
    if (cached && cached.exp > Date.now()) {
      return { hits: cached.hits, citations: this.toCitations(cached.hits), fromCache: true };
    }
    const seen = new Set<string>();
    const hits: SearchHit[] = [];
    for (const p of this.providers) {
      try {
        const partial = await p.search(query);
        for (const h of partial) {
          if (seen.has(h.url)) continue;
          seen.add(h.url);
          hits.push(h);
        }
      } catch {
        /* provider error → skip, try next (fallback) */
      }
      if (hits.length >= (query.limit ?? 10)) break;
    }
    const final = hits.slice(0, query.limit ?? 10);
    this.cache.set(key, { hits: final, exp: Date.now() + this.cfg.cacheTtlMs });
    return { hits: final, citations: this.toCitations(final), fromCache: false };
  }

  private toCitations(hits: readonly SearchHit[]): readonly Citation[] {
    return hits.map((h) => ({
      title: h.title,
      url: h.url,
      snippet: h.snippet,
      source: h.source,
      trusted: this.isTrusted(h.url),
    }));
  }

  clearCache(): void {
    this.cache.clear();
  }
}
