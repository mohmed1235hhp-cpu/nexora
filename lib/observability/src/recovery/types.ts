export type RecoveryOutcome = "recovered" | "failed" | "skipped";
export interface RecoveryContext {
  readonly reason: string;
  readonly target?: string;
  readonly attempt: number;
  readonly data?: Readonly<Record<string, string | number | boolean>>;
}
export interface RecoveryResult {
  readonly strategy: string;
  readonly outcome: RecoveryOutcome;
  readonly ts: number;
  readonly durationMs: number;
  readonly message?: string;
}
export interface RecoveryStrategy {
  readonly name: string;
  canHandle(ctx: RecoveryContext): boolean;
  run(ctx: RecoveryContext): Promise<RecoveryResult>;
}
