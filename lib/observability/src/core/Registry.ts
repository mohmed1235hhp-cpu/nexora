import type { Named } from "./types.js";
/** Name-indexed registry with strict duplicate protection. */
export class Registry<T extends Named> {
  private readonly items = new Map<string, T>();
  register(item: T): T {
    if (this.items.has(item.name)) {
      throw new Error(`Registry: '${item.name}' already registered`);
    }
    this.items.set(item.name, item);
    return item;
  }
  upsert(item: T): T { this.items.set(item.name, item); return item; }
  get(name: string): T | undefined { return this.items.get(name); }
  has(name: string): boolean { return this.items.has(name); }
  delete(name: string): boolean { return this.items.delete(name); }
  list(): readonly T[] { return Array.from(this.items.values()); }
  size(): number { return this.items.size; }
  clear(): void { this.items.clear(); }
}
