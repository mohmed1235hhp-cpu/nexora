export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry { level: LogLevel; message: string; ts: number; scope?: string; data?: unknown; }
export interface Logger {
  debug(msg: string, data?: unknown): void;
  info(msg: string, data?: unknown): void;
  warn(msg: string, data?: unknown): void;
  error(msg: string, data?: unknown): void;
  child(scope: string): Logger;
}
export function createLogger(scope = 'deploy', sink: (e: LogEntry) => void = () => {}): Logger {
  const make = (level: LogLevel) => (message: string, data?: unknown) =>
    sink({ level, message, ts: Date.now(), scope, data });
  return {
    debug: make('debug'), info: make('info'), warn: make('warn'), error: make('error'),
    child: (s: string) => createLogger(`${scope}:${s}`, sink),
  };
}
