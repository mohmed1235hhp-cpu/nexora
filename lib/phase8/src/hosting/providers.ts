/**
 * Phase 8 — Hosting provider abstraction.
 *
 * Extends `IHostingService` (single-provider) into a registry so multiple
 * providers can coexist and be selected per deployment. Ships with:
 *   - LocalStaticProvider    (writes artifacts to a local dir, serves via caller-owned proxy)
 *   - CloudflarePagesProvider (via provider REST API — requires token, config-driven)
 *   - StubProvider           (for tests / dry-run)
 *
 * The two remote providers accept dependency-injected fetch so they can
 * run in Node, Deno, Bun, Cloudflare Workers, or in tests.
 */
import type { IHostingService } from '@workspace/deploy-platform/interfaces';
import type { HostedProject } from '@workspace/deploy-platform/types';

export interface HostingProvider extends IHostingService {
  readonly kind: string;
}

/** Central registry, picks provider by config or per-request override. */
export class HostingProviderRegistry {
  private readonly providers = new Map<string, HostingProvider>();
  private defaultKind: string | undefined;

  register(provider: HostingProvider, opts?: { asDefault?: boolean }): void {
    this.providers.set(provider.kind, provider);
    if (opts?.asDefault || !this.defaultKind) this.defaultKind = provider.kind;
  }

  get(kind?: string): HostingProvider {
    const k = kind ?? this.defaultKind;
    if (!k) throw new Error('No hosting provider registered');
    const p = this.providers.get(k);
    if (!p) throw new Error(`Unknown hosting provider: ${k}`);
    return p;
  }

  list(): readonly HostingProvider[] { return Array.from(this.providers.values()); }
}

/** Simple in-memory provider for tests. */
export class StubProvider implements HostingProvider {
  readonly kind = 'stub';
  private readonly store = new Map<string, HostedProject>();
  async publish(input: { projectId: string; buildId: string; artifactIds: readonly string[] }): Promise<HostedProject> {
    const hp: HostedProject = {
      projectId: input.projectId,
      buildId: input.buildId,
      internalUrl: `stub://${input.projectId}/${input.buildId}`,
      ssl: false,
      createdAt: Date.now(),
    };
    this.store.set(input.projectId, hp);
    return hp;
  }
  async unpublish(projectId: string): Promise<boolean> { return this.store.delete(projectId); }
  async get(projectId: string): Promise<HostedProject | undefined> { return this.store.get(projectId); }
  async list(): Promise<readonly HostedProject[]> { return Array.from(this.store.values()); }
}

/**
 * LocalStaticProvider — publishes the artifact set into a directory the
 * reverse-proxy (see ../proxy) serves. Filesystem is injected so the
 * provider is portable.
 */
export interface LocalFsPort {
  mkdirp(dir: string): Promise<void>;
  writeFile(path: string, content: Uint8Array): Promise<void>;
  rmDir(dir: string): Promise<void>;
  join(...parts: string[]): string;
}
export interface LocalArtifactSource {
  fetchArtifact(id: string): Promise<{ path: string; content: Uint8Array } | undefined>;
}

export class LocalStaticProvider implements HostingProvider {
  readonly kind = 'local-static';
  private readonly hosted = new Map<string, HostedProject>();

  constructor(
    private readonly opts: {
      readonly rootDir: string;
      readonly baseUrl: string;
      readonly fs: LocalFsPort;
      readonly artifacts: LocalArtifactSource;
    },
  ) {}

  async publish(input: { projectId: string; buildId: string; artifactIds: readonly string[] }): Promise<HostedProject> {
    const dir = this.opts.fs.join(this.opts.rootDir, input.projectId);
    await this.opts.fs.mkdirp(dir);
    for (const id of input.artifactIds) {
      const art = await this.opts.artifacts.fetchArtifact(id);
      if (!art) continue;
      const full = this.opts.fs.join(dir, art.path);
      const parent = full.split('/').slice(0, -1).join('/');
      await this.opts.fs.mkdirp(parent);
      await this.opts.fs.writeFile(full, art.content);
    }
    const hp: HostedProject = {
      projectId: input.projectId,
      buildId: input.buildId,
      internalUrl: `${this.opts.baseUrl.replace(/\/$/, '')}/${input.projectId}/`,
      ssl: this.opts.baseUrl.startsWith('https://'),
      createdAt: Date.now(),
    };
    this.hosted.set(input.projectId, hp);
    return hp;
  }
  async unpublish(projectId: string): Promise<boolean> {
    const existed = this.hosted.delete(projectId);
    if (existed) await this.opts.fs.rmDir(this.opts.fs.join(this.opts.rootDir, projectId));
    return existed;
  }
  async get(projectId: string): Promise<HostedProject | undefined> { return this.hosted.get(projectId); }
  async list(): Promise<readonly HostedProject[]> { return Array.from(this.hosted.values()); }
}

/**
 * CloudflarePagesProvider — creates a deployment via the Pages Direct
 * Upload API. Wraps only what's stable; the caller must supply the
 * account/project via config and a Bearer token via env or secret manager.
 *
 * Real deployment plumbing (chunked upload of every asset, manifest
 * generation) is delegated to `uploader` so this file has no vendor SDK
 * dependency and stays test-friendly.
 */
export interface CloudflareUploader {
  upload(input: {
    accountId: string;
    projectName: string;
    token: string;
    artifactIds: readonly string[];
  }): Promise<{ url: string; deploymentId: string }>;
}
export class CloudflarePagesProvider implements HostingProvider {
  readonly kind = 'cloudflare-pages';
  private readonly deployments = new Map<string, HostedProject>();
  constructor(
    private readonly opts: {
      readonly accountId: string;
      readonly projectName: string;
      readonly token: string;
      readonly uploader: CloudflareUploader;
    },
  ) {}

  async publish(input: { projectId: string; buildId: string; artifactIds: readonly string[] }): Promise<HostedProject> {
    const { url } = await this.opts.uploader.upload({
      accountId: this.opts.accountId,
      projectName: this.opts.projectName,
      token: this.opts.token,
      artifactIds: input.artifactIds,
    });
    const hp: HostedProject = {
      projectId: input.projectId,
      buildId: input.buildId,
      internalUrl: url,
      ssl: url.startsWith('https://'),
      createdAt: Date.now(),
    };
    this.deployments.set(input.projectId, hp);
    return hp;
  }
  async unpublish(projectId: string): Promise<boolean> { return this.deployments.delete(projectId); }
  async get(projectId: string): Promise<HostedProject | undefined> { return this.deployments.get(projectId); }
  async list(): Promise<readonly HostedProject[]> { return Array.from(this.deployments.values()); }
}
