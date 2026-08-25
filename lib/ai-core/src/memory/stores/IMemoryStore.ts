import type { MemoryEntry } from "../../types/memory.types";

export interface IMemoryStore {
  get<T>(key: string): Promise<MemoryEntry<T> | undefined>;
  set<T>(entry: MemoryEntry<T>): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}
