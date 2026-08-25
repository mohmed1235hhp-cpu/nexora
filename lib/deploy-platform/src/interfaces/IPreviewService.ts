export interface PreviewHandle {
  readonly buildId: string;
  readonly url: string;
  readonly expiresAt: number;
}
export interface IPreviewService {
  create(input: { projectId: string; buildId: string; artifactIds: readonly string[] }): Promise<PreviewHandle>;
  get(buildId: string): Promise<PreviewHandle | undefined>;
  revoke(buildId: string): Promise<boolean>;
}
