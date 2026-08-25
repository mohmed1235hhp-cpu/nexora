import type { IIsolation, IsolationContext } from '../interfaces/IIsolation.js';
export class IsolationPlaceholder implements IIsolation {
  async create(id: string): Promise<IsolationContext> { return { id, workDir: `/tmp/deploy/${id}` }; }
  async destroy(_ctx: IsolationContext): Promise<void> { /* no-op */ }
}
