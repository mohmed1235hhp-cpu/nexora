export class PromptCache<V = unknown> {
  private map = new Map<string, { value: V; expiresAt: number }>();
  constructor(private defaultTtlMs = 5 * 60_000) {}

  get(key: string): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V, ttlMs?: number): void {
    this.map.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) });
  }

  clear(): void {
    this.map.clear();
  }
}
