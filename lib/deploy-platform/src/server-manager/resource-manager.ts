export interface ResourceQuota { readonly cpu: number; readonly memoryMb: number; readonly diskMb: number; }
export class ResourceManagerPlaceholder {
  private quotas = new Map<string, ResourceQuota>();
  set(projectId: string, quota: ResourceQuota): void { this.quotas.set(projectId, quota); }
  get(projectId: string) { return this.quotas.get(projectId); }
}
