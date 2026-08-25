/**
 * Isolated Sandbox per AI Agent.
 * Provides independent memory, cache, tools, context, logs.
 * No sandbox can read another sandbox's state.
 */
import type { ScopedLogger } from "../logging/PlatformLogger";

export interface SandboxTool {
  readonly name: string;
  invoke(input: unknown): Promise<unknown>;
}

export class AgentSandbox {
  private readonly memory = new Map<string, unknown>();
  private readonly cache = new Map<string, { value: unknown; exp: number }>();
  private readonly tools = new Map<string, SandboxTool>();
  private readonly logs: string[] = [];

  constructor(
    public readonly agentId: string,
    public readonly sessionId: string,
    private readonly logger: ScopedLogger,
  ) {}

  // memory -------------------------------------------------------------
  setMemory(key: string, value: unknown): void {
    this.memory.set(key, value);
  }
  getMemory<T = unknown>(key: string): T | undefined {
    return this.memory.get(key) as T | undefined;
  }

  // cache --------------------------------------------------------------
  cacheSet(key: string, value: unknown, ttlMs = 60_000): void {
    this.cache.set(key, { value, exp: Date.now() + ttlMs });
  }
  cacheGet<T = unknown>(key: string): T | undefined {
    const e = this.cache.get(key);
    if (!e) return undefined;
    if (Date.now() > e.exp) {
      this.cache.delete(key);
      return undefined;
    }
    return e.value as T;
  }

  // tools --------------------------------------------------------------
  registerTool(tool: SandboxTool): void {
    this.tools.set(tool.name, tool);
  }
  async invokeTool(name: string, input: unknown): Promise<unknown> {
    const t = this.tools.get(name);
    if (!t) throw new Error(`sandbox tool '${name}' not registered for agent ${this.agentId}`);
    return t.invoke(input);
  }

  // logs ---------------------------------------------------------------
  log(message: string): void {
    this.logs.push(`[${new Date().toISOString()}] ${message}`);
    this.logger.debug(message, { agent: this.agentId });
  }
  snapshotLogs(): readonly string[] {
    return this.logs.slice();
  }

  // lifecycle ----------------------------------------------------------
  dispose(): void {
    this.memory.clear();
    this.cache.clear();
    this.tools.clear();
    this.logs.length = 0;
  }
}

export class SandboxManager {
  private readonly sandboxes = new Map<string, AgentSandbox>();
  constructor(private readonly loggerFactory: (scope: string) => ScopedLogger) {}

  private key(agentId: string, sessionId: string): string {
    return `${sessionId}::${agentId}`;
  }

  getOrCreate(agentId: string, sessionId: string): AgentSandbox {
    const k = this.key(agentId, sessionId);
    let sb = this.sandboxes.get(k);
    if (!sb) {
      sb = new AgentSandbox(agentId, sessionId, this.loggerFactory(`sandbox:${agentId}`));
      this.sandboxes.set(k, sb);
    }
    return sb;
  }

  dispose(agentId: string, sessionId: string): void {
    const k = this.key(agentId, sessionId);
    const sb = this.sandboxes.get(k);
    if (sb) {
      sb.dispose();
      this.sandboxes.delete(k);
    }
  }

  disposeSession(sessionId: string): void {
    for (const k of Array.from(this.sandboxes.keys())) {
      if (k.startsWith(`${sessionId}::`)) {
        this.sandboxes.get(k)?.dispose();
        this.sandboxes.delete(k);
      }
    }
  }

  count(): number {
    return this.sandboxes.size;
  }
}
