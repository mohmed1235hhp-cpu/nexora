/**
 * Phase 8 — Domain manager.
 *
 * Maps external hostnames to hosted projects and tracks SSL certificate
 * state. Certificate issuance is delegated to `IAcmeClient` so operators
 * can plug in a real ACME client (e.g. acme-client, greenlock) or a
 * managed edge provider (Cloudflare, Vercel) that handles certificates
 * externally — in which case the client is a no-op that returns "ready".
 */
export interface DomainRecord {
  readonly domain: string;
  readonly projectId: string;
  readonly ssl: 'none' | 'pending' | 'ready' | 'error';
  readonly certExpiresAt?: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface IAcmeClient {
  /** Kick off (or check) issuance for the domain; return final SSL state. */
  issue(domain: string): Promise<{ ssl: 'ready' | 'pending' | 'error'; expiresAt?: number; error?: string }>;
  revoke?(domain: string): Promise<void>;
}

/** No-op ACME client for managed platforms that provision certs out-of-band. */
export class ManagedAcmeClient implements IAcmeClient {
  async issue(_domain: string): Promise<{ ssl: 'ready'; expiresAt: number }> {
    return { ssl: 'ready', expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000 };
  }
}

export class DomainManager {
  private readonly records = new Map<string, DomainRecord>();
  constructor(private readonly acme: IAcmeClient) {}

  async add(domain: string, projectId: string): Promise<DomainRecord> {
    const now = Date.now();
    const initial: DomainRecord = {
      domain, projectId,
      ssl: 'pending',
      createdAt: now, updatedAt: now,
    };
    this.records.set(domain, initial);
    try {
      const res = await this.acme.issue(domain);
      const updated: DomainRecord = {
        ...initial,
        ssl: res.ssl,
        certExpiresAt: res.expiresAt,
        updatedAt: Date.now(),
      };
      this.records.set(domain, updated);
      return updated;
    } catch (err) {
      const updated: DomainRecord = { ...initial, ssl: 'error', updatedAt: Date.now() };
      this.records.set(domain, updated);
      throw err;
    }
  }

  async remove(domain: string): Promise<boolean> {
    const existed = this.records.delete(domain);
    if (existed && this.acme.revoke) { try { await this.acme.revoke(domain); } catch { /* ignore */ } }
    return existed;
  }

  get(domain: string): DomainRecord | undefined { return this.records.get(domain); }
  list(): readonly DomainRecord[] { return Array.from(this.records.values()); }

  /** Records due for renewal in the next `windowDays` (default 30). */
  dueForRenewal(windowDays = 30): readonly DomainRecord[] {
    const cutoff = Date.now() + windowDays * 24 * 60 * 60 * 1000;
    return this.list().filter(r => r.ssl === 'ready' && r.certExpiresAt !== undefined && r.certExpiresAt < cutoff);
  }
}
