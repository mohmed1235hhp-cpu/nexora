/**
 * Framework-agnostic SSE (Server-Sent Events) handler for the monitoring bus.
 *
 * Returns a `(req, res)` style function compatible with Node http/express,
 * and a Web `Request -> Response` variant for edge runtimes.
 */
import type { MonitoringBus, MonitoringEvent } from './MonitoringBus.js';

function serialize(e: MonitoringEvent): string {
  // `id:` allows browsers to resume via Last-Event-ID header on reconnect.
  return `id: ${e.id}\nevent: ${e.kind}\ndata: ${JSON.stringify(e)}\n\n`;
}

export interface SSEHandler {
  /** Web-standards handler: `(request) => Response`. */
  handle(request: Request): Response;
}

export function createSSEHandler(bus: MonitoringBus, opts?: { replay?: number; heartbeatMs?: number }): SSEHandler {
  const replay = opts?.replay ?? 50;
  const heartbeatMs = opts?.heartbeatMs ?? 15000;

  return {
    handle(_request: Request): Response {
      let unsubscribe: (() => void) | undefined;
      let heartbeat: ReturnType<typeof setInterval> | undefined;

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const enc = new TextEncoder();
          const send = (chunk: string): void => {
            try { controller.enqueue(enc.encode(chunk)); }
            catch { /* controller closed */ }
          };
          send(`retry: 2000\n\n`);
          unsubscribe = bus.subscribe((e) => send(serialize(e)), { replay });
          heartbeat = setInterval(() => send(`: heartbeat ${Date.now()}\n\n`), heartbeatMs);
        },
        cancel() {
          if (unsubscribe) unsubscribe();
          if (heartbeat) clearInterval(heartbeat);
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    },
  };
}
