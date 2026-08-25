/**
 * Unified Memory Manager (Phase 1).
 * Layers:
 *   - Conversation memory  (per session, short-term dialog turns)
 *   - Session memory       (per session, arbitrary kv)
 *   - Project memory       (per project id, cross-session)
 *   - Long-term memory     (per user, cross-project)
 *   - Temporary memory     (auto-expire)
 *   - Context memory       (snapshot for the current request)
 *
 * Backed by a pluggable IMemoryStore so we can swap in Redis / Postgres / Supabase later.
 */

export interface IMemoryStore {
  get<T = unknown>(ns: string, key: string): Promise<T | undefined>;
  set<T = unknown>(ns: string, key: string, value: T, ttlMs?: number): Promise<void>;
  delete(ns: string, key: string): Promise<void>;
  list(ns: string, prefix?: string): Promise<readonly string[]>;
}

export class InMemoryStore implements IMemoryStore {
  private readonly data = new Map<string, { v: unknown; exp?: number }>();
  private k(ns: string, key: string): string {
    return `${ns}::${key}`;
  }
  async get<T>(ns: string, key: string): Promise<T | undefined> {
    const rec = this.data.get(this.k(ns, key));
    if (!rec) return undefined;
    if (rec.exp && Date.now() > rec.exp) {
      this.data.delete(this.k(ns, key));
      return undefined;
    }
    return rec.v as T;
  }
  async set<T>(ns: string, key: string, value: T, ttlMs?: number): Promise<void> {
    this.data.set(this.k(ns, key), { v: value, exp: ttlMs ? Date.now() + ttlMs : undefined });
  }
  async delete(ns: string, key: string): Promise<void> {
    this.data.delete(this.k(ns, key));
  }
  async list(ns: string, prefix = ""): Promise<readonly string[]> {
    const p = `${ns}::${prefix}`;
    const out: string[] = [];
    for (const k of this.data.keys()) if (k.startsWith(p)) out.push(k.substring(`${ns}::`.length));
    return out;
  }
}

export interface ConversationTurn {
  readonly role: "user" | "assistant" | "system";
  readonly content: string;
  readonly ts: number;
}

export class MemoryManager {
  constructor(private readonly store: IMemoryStore = new InMemoryStore()) {}

  // conversation --------------------------------------------------
  async appendTurn(sessionId: string, turn: ConversationTurn): Promise<void> {
    const key = "history";
    const prev = (await this.store.get<readonly ConversationTurn[]>(`conv:${sessionId}`, key)) ?? [];
    const next = [...prev, turn].slice(-200);
    await this.store.set(`conv:${sessionId}`, key, next);
  }
  async getConversation(sessionId: string): Promise<readonly ConversationTurn[]> {
    return (await this.store.get<readonly ConversationTurn[]>(`conv:${sessionId}`, "history")) ?? [];
  }

  // session -------------------------------------------------------
  setSession<T>(sessionId: string, key: string, value: T): Promise<void> {
    return this.store.set(`session:${sessionId}`, key, value);
  }
  getSession<T>(sessionId: string, key: string): Promise<T | undefined> {
    return this.store.get<T>(`session:${sessionId}`, key);
  }

  // project -------------------------------------------------------
  setProject<T>(projectId: string, key: string, value: T): Promise<void> {
    return this.store.set(`project:${projectId}`, key, value);
  }
  getProject<T>(projectId: string, key: string): Promise<T | undefined> {
    return this.store.get<T>(`project:${projectId}`, key);
  }

  // long-term -----------------------------------------------------
  setLongTerm<T>(userId: string, key: string, value: T): Promise<void> {
    return this.store.set(`long:${userId}`, key, value);
  }
  getLongTerm<T>(userId: string, key: string): Promise<T | undefined> {
    return this.store.get<T>(`long:${userId}`, key);
  }

  // temporary -----------------------------------------------------
  setTemp<T>(scope: string, key: string, value: T, ttlMs = 60_000): Promise<void> {
    return this.store.set(`temp:${scope}`, key, value, ttlMs);
  }
  getTemp<T>(scope: string, key: string): Promise<T | undefined> {
    return this.store.get<T>(`temp:${scope}`, key);
  }

  // context (per request) ----------------------------------------
  async snapshotContext(sessionId: string): Promise<{
    conversation: readonly ConversationTurn[];
    session: Readonly<Record<string, unknown>>;
  }> {
    const conversation = await this.getConversation(sessionId);
    const keys = await this.store.list(`session:${sessionId}`);
    const session: Record<string, unknown> = {};
    for (const k of keys) session[k] = await this.store.get(`session:${sessionId}`, k);
    return { conversation, session };
  }
}
