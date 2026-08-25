export class BuildCache<V> {
  private map = new Map<string, V>();
  get(key: string): V | undefined { return this.map.get(key); }
  set(key: string, value: V): void { this.map.set(key, value); }
  clear(): void { this.map.clear(); }
  size(): number { return this.map.size; }
}
