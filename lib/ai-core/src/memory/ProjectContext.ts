import type { IMemoryStore } from "./stores/IMemoryStore";
import { InMemoryStore } from "./stores/InMemoryStore";

export class ProjectContext {
  private readonly scope = "project" as const;
  constructor(private store: IMemoryStore = new InMemoryStore()) {}

  async remember<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    await this.store.set({
      key: `${this.scope}:${key}`,
      value,
      scope: this.scope,
      ttlMs,
      createdAt: new Date().toISOString(),
    });
  }

  async recall<T>(key: string): Promise<T | undefined> {
    const entry = await this.store.get<T>(`${this.scope}:${key}`);
    return entry?.value;
  }

  async forget(key: string): Promise<void> {
    await this.store.delete(`${this.scope}:${key}`);
  }
}
