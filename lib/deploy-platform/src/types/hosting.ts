export interface HostedProject {
  readonly projectId: string;
  readonly buildId: string;
  readonly internalUrl: string;
  readonly domain?: string;
  readonly ssl: boolean;
  readonly createdAt: number;
}
