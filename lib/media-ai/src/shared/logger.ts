export interface MediaLogger {
  debug(msg: string, meta?: Record<string, unknown>): void;
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
}
export const consoleLogger: MediaLogger = {
  debug: (m, x) => console.debug(`[media] ${m}`, x ?? ""),
  info:  (m, x) => console.info(`[media] ${m}`, x ?? ""),
  warn:  (m, x) => console.warn(`[media] ${m}`, x ?? ""),
  error: (m, x) => console.error(`[media] ${m}`, x ?? ""),
};
