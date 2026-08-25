import { describe, it, expect } from 'vitest';
import { ServerManager } from '../src/server-manager/ServerManager.js';
import { ReverseProxyRouter } from '../src/proxy/ReverseProxy.js';
import { DomainManager, ManagedAcmeClient } from '../src/hosting/DomainManager.js';
import { StubProvider, HostingProviderRegistry } from '../src/hosting/providers.js';

describe('ServerManager', () => {
  it('marks nodes down after heartbeat timeout', () => {
    let now = 1000;
    const sm = new ServerManager({ heartbeatTimeoutMs: 100, clock: () => now });
    sm.register({ id: 'n1', region: 'eu', capacity: 4, tags: [] });
    sm.reportHeartbeat('n1');
    now = 1200;
    const found = sm.list().find(n => n.id === 'n1');
    expect(found?.status).toBe('down');
  });
});

describe('ReverseProxyRouter', () => {
  it('routes host to registered rule', () => {
    const r = new ReverseProxyRouter();
    r.upsert({ host: 'app.example.com', projectId: 'p1', targets: [{ nodeId: 'n1', url: 'http://10.0.0.1' }] });
    expect(r.pickTarget('app.example.com')?.target.url).toBe('http://10.0.0.1');
    expect(r.pickTarget('missing.com')).toBeUndefined();
  });
  it('supports wildcards', () => {
    const r = new ReverseProxyRouter();
    r.upsert({ host: '*.tenant.com', projectId: 'p2', targets: [{ nodeId: 'n', url: 'http://x' }] });
    expect(r.pickTarget('abc.tenant.com')).toBeDefined();
  });
});

describe('DomainManager', () => {
  it('issues SSL via managed ACME', async () => {
    const dm = new DomainManager(new ManagedAcmeClient());
    const rec = await dm.add('a.example', 'p1');
    expect(rec.ssl).toBe('ready');
    expect(rec.certExpiresAt).toBeGreaterThan(Date.now());
  });
});

describe('HostingProviderRegistry', () => {
  it('picks default provider', async () => {
    const reg = new HostingProviderRegistry();
    reg.register(new StubProvider(), { asDefault: true });
    const p = reg.get();
    const hosted = await p.publish({ projectId: 'p', buildId: 'b', artifactIds: [] });
    expect(hosted.internalUrl).toContain('stub://');
  });
});
