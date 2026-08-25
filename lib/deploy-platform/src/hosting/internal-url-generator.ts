export interface InternalUrlOptions { readonly baseDomain?: string; }
export class InternalUrlGenerator {
  constructor(private opts: InternalUrlOptions = { baseDomain: 'internal.local' }) {}
  urlFor(projectId: string, buildId?: string): string {
    const host = `${projectId}${buildId ? `--${buildId}` : ''}.${this.opts.baseDomain}`;
    return `https://${host}`;
  }
}
