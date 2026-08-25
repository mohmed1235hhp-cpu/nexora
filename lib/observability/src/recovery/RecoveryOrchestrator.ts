import { EventBus } from "../core/EventBus.js";
import type { RecoveryContext, RecoveryResult, RecoveryStrategy } from "./types.js";

export class RecoveryOrchestrator {
  readonly events = new EventBus<RecoveryResult>();
  private readonly strategies: RecoveryStrategy[] = [];
  private readonly history: RecoveryResult[] = [];

  register(s: RecoveryStrategy): this { this.strategies.push(s); return this; }
  recent(): readonly RecoveryResult[] { return [...this.history]; }

  async trigger(ctx: RecoveryContext): Promise<readonly RecoveryResult[]> {
    const applicable = this.strategies.filter(s => s.canHandle(ctx));
    const results: RecoveryResult[] = [];
    for (const s of applicable) {
      const r = await s.run(ctx);
      this.history.push(r); if (this.history.length > 500) this.history.shift();
      results.push(r); await this.events.publish(r);
    }
    return results;
  }
}
