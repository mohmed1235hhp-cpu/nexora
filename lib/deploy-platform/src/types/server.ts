export type ServerStatus = 'unknown' | 'healthy' | 'degraded' | 'down';
export interface ServerNode {
  readonly id: string;
  readonly region: string;
  readonly capacity: number;
  readonly status: ServerStatus;
  readonly lastHeartbeat: number;
  readonly tags: readonly string[];
}
