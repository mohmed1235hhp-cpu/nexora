/**
 * Zero-trust permission system: every request is validated,
 * every agent invocation is checked against a scope list.
 */
export type Permission =
  | "request.submit"
  | "agent.invoke"
  | "memory.read"
  | "memory.write"
  | "search.internet"
  | "sandbox.create"
  | "admin";

export interface Principal {
  readonly userId?: string;
  readonly sessionId: string;
  readonly permissions: ReadonlySet<Permission>;
}

export function grant(all: readonly Permission[]): ReadonlySet<Permission> {
  return new Set(all);
}

export class PermissionSystem {
  constructor(private readonly defaultGrants: readonly Permission[] = ["request.submit", "agent.invoke", "memory.read", "memory.write", "search.internet", "sandbox.create"]) {}

  makePrincipal(sessionId: string, userId?: string, extra?: readonly Permission[]): Principal {
    return { sessionId, userId, permissions: grant([...this.defaultGrants, ...(extra ?? [])]) };
  }

  require(principal: Principal, perm: Permission): void {
    if (!principal.permissions.has(perm) && !principal.permissions.has("admin")) {
      throw new PermissionError(`missing permission: ${perm}`);
    }
  }

  check(principal: Principal, perm: Permission): boolean {
    return principal.permissions.has(perm) || principal.permissions.has("admin");
  }
}

export class PermissionError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "PermissionError";
  }
}
