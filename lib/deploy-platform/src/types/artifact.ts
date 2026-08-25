export interface ArtifactMeta {
  readonly id: string;
  readonly buildId: string;
  readonly projectId: string;
  readonly path: string;
  readonly size: number;
  readonly contentType: string;
  readonly version: number;
  readonly checksum: string;
  readonly createdAt: number;
}
