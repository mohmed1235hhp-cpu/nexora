export type Permission = 'build' | 'deploy' | 'preview' | 'read-artifacts' | 'admin';
export class PermissionSet {
  private map = new Map<string, Set<Permission>>();
  grant(userId: string, perm: Permission): void {
    const cur = this.map.get(userId) ?? new Set<Permission>();
    cur.add(perm);
    this.map.set(userId, cur);
  }
  has(userId: string, perm: Permission): boolean {
    return this.map.get(userId)?.has(perm) ?? false;
  }
}
