export type Token<T> = string & { __t?: T };
export const token = <T>(name: string): Token<T> => name as Token<T>;
export class Container {
  private reg = new Map<string, unknown>();
  register<T>(t: Token<T>, value: T): void { this.reg.set(t, value); }
  resolve<T>(t: Token<T>): T {
    if (!this.reg.has(t)) throw new Error(`DI token not registered: ${t}`);
    return this.reg.get(t) as T;
  }
  has<T>(t: Token<T>): boolean { return this.reg.has(t); }
}
export const container = new Container();
