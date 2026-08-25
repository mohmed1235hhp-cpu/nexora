export interface DomainRecord { readonly projectId: string; readonly domain: string; readonly verified: boolean; }
export class DomainPlaceholder {
  private records = new Map<string, DomainRecord>();
  attach(projectId: string, domain: string): DomainRecord {
    const rec: DomainRecord = { projectId, domain, verified: false };
    this.records.set(projectId, rec);
    return rec;
  }
  get(projectId: string) { return this.records.get(projectId); }
  list(): readonly DomainRecord[] { return [...this.records.values()]; }
}
