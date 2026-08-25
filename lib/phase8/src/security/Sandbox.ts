/**
 * Phase 8 — Security: Sandbox, artifact signer, code isolation.
 *
 * All primitives are pluggable — the sandbox uses Node's `vm.Script` for a
 * lightweight JS sandbox and delegates true OS-level isolation
 * (containers, seccomp, cgroups) to an injected `IIsolation` port so the
 * platform can plug in Firecracker / gVisor / Docker without changing
 * call sites.
 */

/** Simple in-process JS sandbox. Suitable for expression/config eval, NOT untrusted long-running code. */
export class VmSandbox {
  constructor(private readonly opts: { timeoutMs?: number } = {}) {}

  async run<T = unknown>(code: string, context: Record<string, unknown> = {}): Promise<T> {
    // Lazy-import to keep this file usable on non-Node runtimes (typecheck-only).
    const vm = await import('node:vm');
    const sandbox: Record<string, unknown> = { ...context, module: {}, exports: {} };
    const script = new vm.Script(code, { filename: 'sandbox.js' });
    const ctx = vm.createContext(sandbox, { name: 'cyberai-sandbox' });
    return script.runInContext(ctx, {
      timeout: this.opts.timeoutMs ?? 2_000,
      breakOnSigint: true,
    }) as T;
  }
}

/**
 * Ed25519 artifact signer. Uses the WebCrypto SubtleCrypto API so it
 * works in Node ≥ 20, Deno, Bun, Cloudflare Workers, and browsers.
 */
export class ArtifactSigner {
  constructor(private readonly keyPair: CryptoKeyPair) {}

  static async generate(): Promise<ArtifactSigner> {
    const kp = await crypto.subtle.generateKey(
      { name: 'Ed25519' } as unknown as EcKeyGenParams,
      true,
      ['sign', 'verify'],
    ) as CryptoKeyPair;
    return new ArtifactSigner(kp);
  }

  static async importPrivateJwk(jwk: JsonWebKey): Promise<ArtifactSigner> {
    const priv = await crypto.subtle.importKey('jwk', jwk, { name: 'Ed25519' }, true, ['sign']);
    // We derive a "verify" pair only if a public JWK is passed via keyPair.publicKey elsewhere.
    // For most cases the caller signs; verification uses a separate exported public key.
    const pub = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, crv: jwk.crv, x: jwk.x, key_ops: ['verify'] } as JsonWebKey,
      { name: 'Ed25519' }, true, ['verify'],
    );
    return new ArtifactSigner({ privateKey: priv, publicKey: pub });
  }

  async sign(payload: Uint8Array): Promise<Uint8Array> {
    const sig = await crypto.subtle.sign({ name: 'Ed25519' }, this.keyPair.privateKey, payload as BufferSource);
    return new Uint8Array(sig);
  }

  async exportPublicKey(): Promise<JsonWebKey> {
    return crypto.subtle.exportKey('jwk', this.keyPair.publicKey);
  }
}

export async function verifyArtifactSignature(
  publicKeyJwk: JsonWebKey,
  payload: Uint8Array,
  signature: Uint8Array,
): Promise<boolean> {
  const pub = await crypto.subtle.importKey('jwk', publicKeyJwk, { name: 'Ed25519' }, true, ['verify']);
  return crypto.subtle.verify({ name: 'Ed25519' }, pub, signature as BufferSource, payload as BufferSource);
}

/**
 * Safe test-runner: forks a fresh child_process with resource limits.
 * The concrete process launcher is injected so this stays testable.
 */
export interface IProcessLauncher {
  spawn(input: { cmd: string; args: readonly string[]; cwd: string; env: Readonly<Record<string, string>>; timeoutMs: number }):
    Promise<{ code: number; stdout: string; stderr: string }>;
}

export interface TestRunnerOptions {
  readonly launcher: IProcessLauncher;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
}

export class SafeTestRunner {
  constructor(private readonly opts: TestRunnerOptions) {}

  async run(input: { cwd: string; cmd: string; args?: readonly string[]; env?: Readonly<Record<string, string>> }):
    Promise<{ ok: boolean; code: number; stdout: string; stderr: string }> {
    const clip = (s: string): string => {
      const max = this.opts.maxOutputBytes ?? 256 * 1024;
      return s.length > max ? s.slice(0, max) + `\n... (${s.length - max} bytes truncated)` : s;
    };
    const res = await this.opts.launcher.spawn({
      cmd: input.cmd,
      args: input.args ?? [],
      cwd: input.cwd,
      env: { NODE_ENV: 'test', CI: 'true', ...(input.env ?? {}) },
      timeoutMs: this.opts.timeoutMs ?? 60_000,
    });
    return { ok: res.code === 0, code: res.code, stdout: clip(res.stdout), stderr: clip(res.stderr) };
  }
}
