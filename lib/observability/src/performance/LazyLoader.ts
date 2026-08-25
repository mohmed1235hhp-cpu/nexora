/** Runs a factory on demand and memoizes the resolved value. */
export class LazyLoader<T> {
  private value: T | undefined; private loading: Promise<T> | undefined;
  constructor(private readonly factory: () => Promise<T> | T) {}
  async get(): Promise<T> {
    if (this.value !== undefined) return this.value;
    if (this.loading) return this.loading;
    this.loading = Promise.resolve(this.factory()).then(v => (this.value = v));
    try { return await this.loading; } finally { this.loading = undefined; }
  }
  isLoaded(): boolean { return this.value !== undefined; }
  reset(): void { this.value = undefined; }
}
