import type { IMemoryStore } from "../../memory/stores/IMemoryStore";
import type { MemoryEntry } from "../../types/memory.types";

export class MockMemoryStore implements IMemoryStore {
  data = new Map<string, MemoryEntry>();
  async get<T>(k: string): Promise<MemoryEntry<T> | undefined> {
    return this.data.get(k) as MemoryEntry<T> | undefined;
  }
  async set<T>(e: MemoryEntry<T>): Promise<void> {
    this.data.set(e.key, e as MemoryEntry);
  }
  async delete(k: string): Promise<void> {
    this.data.delete(k);
  }
  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }
}
