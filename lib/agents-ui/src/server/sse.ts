/**
 * Server-side helper: expose a Phase 8 MonitoringBus as an SSE endpoint
 * that the React dashboard can subscribe to via `useMonitoringStream`.
 *
 * Framework-agnostic — accepts a Web `Request` and returns a `Response`.
 * The `MonitoringBus` is imported by shape only (structural typing) so
 * this package remains free of a runtime dependency on @workspace/phase8.
 */
export interface MonitoringBusLike {
  subscribe(l: (e: {
    id: string; ts: number; kind: string; source: string; payload: unknown;
  }) => void, opts?: { replay?: number }): () => void;
}

export function createSSEEndpoint(bus: MonitoringBusLike, opts?: { replay?: number; heartbeatMs?: number }) {
  const replay = opts?.replay ?? 50;
  const heartbeatMs = opts?.heartbeatMs ?? 15000;

  return function handle(_request: Request): Response {
    let unsub: (() => void) | undefined;
    let hb: ReturnType<typeof setInterval> | undefined;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder();
        const send = (chunk: string): void => { try { controller.enqueue(enc.encode(chunk)); } catch { /* closed */ } };
        send('retry: 2000\n\n');
        unsub = bus.subscribe(e => send(`id: ${e.id}\nevent: ${e.kind}\ndata: ${JSON.stringify(e)}\n\n`), { replay });
        hb = setInterval(() => send(`: heartbeat ${Date.now()}\n\n`), heartbeatMs);
      },
      cancel() { if (unsub) unsub(); if (hb) clearInterval(hb); },
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
  };
}
