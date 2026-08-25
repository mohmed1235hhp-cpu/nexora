export interface PermissionCheck { userId: string; action: string; }
export type PermissionChecker = (c: PermissionCheck) => Promise<boolean>;
