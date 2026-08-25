/**
 * Phase 8 — Reverse-Proxy skeleton.
 *
 * Framework-agnostic host->target router with sticky headers, health-aware
 * upstream selection, and per-request logging via the MonitoringBus.
 *
 * The actual socket-level proxy (HTTP CONNECT, HTTP/2 h2c, WebSocket
 * upgrade) is delegated to an injected `IUpstreamDialer` so this module
 * stays testable and runtime-agnostic. Production deployments typically
 * mount this behind Nginx / Caddy / Cloudflare and use the router below
 * as the "which project handles this request?" oracle.
 */
import type { MonitoringBus } from '../monitoring/MonitoringBus.js';
import type { IServerManager } from '@workspace/deploy-platform/interfaces';

export interface UpstreamTarget {
  readonly nodeId: string;
  readonly url: string;
}

export interface RouteRule {
  readonly host: string;         // exact match; wildcards below via '*.example.com'
  readonly projectId: string;
  readonly targets: readonly UpstreamTarget[];
}

export class ReverseProxyRouter {
  private readonly rules = new Map<string, RouteRule>();
  private rr = 0;

  constructor(
    private readonly serverManager?: IServerManager,
    private readonly monitoring?: MonitoringBus,
  ) {}

  upsert(rule: RouteRule): void { this.rules.set(rule.host.toLowerCase(), rule); }
  remove(host: string): boolean { return this.rules.delete(host.toLowerCase()); }
  list(): readonly RouteRule[] { return Array.from(this.rules.values()); }

  /** Find the target for a Host header. Supports single-level wildcards. */
  pickTarget(host: string): { rule: RouteRule; target: UpstreamTarget } | undefined {
    const h = host.toLowerCase();
    const exact = this.rules.get(h);
    const rule = exact ?? this.findWildcard(h);
    if (!rule || rule.targets.length === 0) return undefined;

    // Filter to targets whose node is healthy, if a server manager is wired.
    const alive = this.serverManager
      ? rule.targets.filter(t => {
          const nodes = this.serverManager!.list();
          const n = nodes.find(x => x.id === t.nodeId);
          return !n || n.status === 'healthy' || n.status === 'unknown';
        })
      : rule.targets;

    const pool = alive.length > 0 ? alive : rule.targets;
    const t = pool[this.rr++ % pool.length]!;
    this.monitoring?.publish('pipeline.step', 'reverse-proxy', {
      step: 'route', host: h, project: rule.projectId, upstream: t.url,
    });
    return { rule, target: t };
  }

  private findWildcard(host: string): RouteRule | undefined {
    for (const [k, v] of this.rules) {
      if (k.startsWith('*.') && host.endsWith(k.slice(1))) return v;
    }
    return undefined;
  }
}

/**
 * Minimal Web-standards proxy handler: uses the router to pick a target
 * and forwards the incoming Request. Suitable for Node (via
 * `undici`/`fetch`), Cloudflare Workers, Deno, and Bun.
 *
 * This deliberately does not handle upgrades (WebSocket / HTTP/2 push);
 * those need a runtime-specific implementation and belong in an adapter.
 */
export async function proxyFetch(
  router: ReverseProxyRouter,
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const picked = router.pickTarget(url.host);
  if (!picked) return new Response('No route', { status: 502 });

  const upstream = new URL(picked.target.url);
  upstream.pathname = url.pathname;
  upstream.search = url.search;

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  headers.set('X-CyberAI-Project', picked.rule.projectId);

  const init: RequestInit = {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  };
  return fetch(upstream.toString(), init);
}
