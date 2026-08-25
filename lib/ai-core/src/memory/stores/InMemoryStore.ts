import type { IMemoryStore } from "./IMemoryStore";
import type { MemoryEntry } from "../../types/memory.types";

export class InMemoryStore implements IMemoryStore {
  private map = new Map<string, MemoryEntry>();
  async get<T>(key: string): Promise<MemoryEntry<T> | undefined> {
    return this.map.get(key) as MemoryEntry<T> | undefined;
  }
  async set<T>(entry: MemoryEntry<T>): Promise<void> {
    this.map.set(entry.key, entry as MemoryEntry);
  }
  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }
  async keys(): Promise<string[]> {
    return Array.from(this.map.keys());
  }
}
