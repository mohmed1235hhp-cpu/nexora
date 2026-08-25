import type { StoragePort } from "./StoragePort";
export class InMemoryStorage implements StoragePort {
  private map = new Map<string, unknown>();
  async get<T>(k: string){ return (this.map.get(k) as T) ?? null; }
  async set<T>(k: string, v: T){ this.map.set(k, v); }
  async remove(k: string){ this.map.delete(k); }
  async keys(){ return [...this.map.keys()]; }
}
