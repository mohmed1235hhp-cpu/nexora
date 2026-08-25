/**
 * Live monitoring event shape (matches @workspace/phase8/monitoring).
 * Duplicated as a plain type to avoid a cross-package runtime dep.
 */
export interface UIMonitoringEvent {
  readonly id: string;
  readonly ts: number;
  readonly kind: string;
  readonly source: string;
  readonly payload: unknown;
}

/**
 * React hook: subscribe to a Phase 8 SSE endpoint and keep a bounded
 * ring buffer of the latest N events plus derived per-source state.
 *
 * Framework: React 18+. SSR-safe (does nothing on the server).
 */
import { useEffect, useRef, useState } from 'react';

export interface UseMonitoringStreamOptions {
  readonly url: string;
  readonly capacity?: number;
  readonly onEvent?: (e: UIMonitoringEvent) => void;
}

export function useMonitoringStream(opts: UseMonitoringStreamOptions): {
  events: readonly UIMonitoringEvent[];
  connected: boolean;
  error: string | undefined;
} {
  const [events, setEvents] = useState<UIMonitoringEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const onEventRef = useRef(opts.onEvent);
  onEventRef.current = opts.onEvent;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    const cap = Math.max(16, opts.capacity ?? 500);
    const es = new EventSource(opts.url);
    es.onopen = (): void => { setConnected(true); setError(undefined); };
    es.onerror = (): void => { setConnected(false); setError('stream error'); };
    es.onmessage = (msg: MessageEvent<string>): void => {
      try {
        const e = JSON.parse(msg.data) as UIMonitoringEvent;
        onEventRef.current?.(e);
        setEvents(prev => {
          const next = prev.length >= cap ? prev.slice(prev.length - cap + 1) : prev.slice();
          next.push(e);
          return next;
        });
      } catch { /* ignore malformed frame */ }
    };
    return (): void => es.close();
  }, [opts.url, opts.capacity]);

  return { events, connected, error };
}
