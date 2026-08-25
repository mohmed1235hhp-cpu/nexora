import type { PreviewHandle } from '../interfaces/IPreviewService.js';
export class PreviewRegistry {
  private handles = new Map<string, PreviewHandle>();
  set(handle: PreviewHandle): void { this.handles.set(handle.buildId, handle); }
  get(buildId: string) { return this.handles.get(buildId); }
  delete(buildId: string): boolean { return this.handles.delete(buildId); }
  list(): readonly PreviewHandle[] { return [...this.handles.values()]; }
}
