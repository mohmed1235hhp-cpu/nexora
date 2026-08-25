export interface IsolationContext { readonly id: string; readonly workDir: string; }
export interface IIsolation {
  create(id: string): Promise<IsolationContext>;
  destroy(ctx: IsolationContext): Promise<void>;
}
