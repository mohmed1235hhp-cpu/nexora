import type { AuthPrincipal, Permission, PermissionRule, ResourceAcl, Role } from "./types.js";

/** RBAC + optional per-resource ACL. */
export class PermissionValidator {
  private readonly byRole = new Map<Role, Set<Permission>>();
  private readonly acls = new Map<string, ResourceAcl>();

  constructor(rules: readonly PermissionRule[] = []) { for (const r of rules) this.grant(r.role, r.permissions); }

  grant(role: Role, perms: readonly Permission[]): void {
    const set = this.byRole.get(role) ?? new Set(); for (const p of perms) set.add(p);
    this.byRole.set(role, set);
  }
  registerAcl(acl: ResourceAcl): void { this.acls.set(acl.resource, acl); }

  can(principal: AuthPrincipal, permission: Permission, resource?: string): boolean {
    for (const role of principal.roles) {
      if (this.byRole.get(role)?.has(permission) || this.byRole.get(role)?.has("*")) return true;
      if (resource) {
        const acl = this.acls.get(resource);
        if (acl && (acl.allow[role]?.includes(permission) || acl.allow[role]?.includes("*"))) return true;
        if (acl?.ownerId && acl.ownerId === principal.id) return true;
      }
    }
    return false;
  }
  assert(principal: AuthPrincipal, permission: Permission, resource?: string): void {
    if (!this.can(principal, permission, resource)) throw new Error(`forbidden: ${permission}${resource ? ` on ${resource}` : ""}`);
  }
}
