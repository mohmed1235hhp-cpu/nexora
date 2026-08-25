export interface AgentResult<TOutput = unknown> {
  ok: boolean;
  output?: TOutput;
  error?: string;
  artifacts?: string[];
  durationMs: number;
  decisions?: string[];
  filesCreated?: number;
  filesModified?: number;
  errorsFound?: number;
  errorsFixed?: number;
}
