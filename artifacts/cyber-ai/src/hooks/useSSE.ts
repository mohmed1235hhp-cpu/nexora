/**
 * Phase 12 — Real-Time Notifications via Server-Sent Events
 */
import { useEffect, useRef, useCallback, useState } from "react";

interface SSEOptions {
  enabled?: boolean;
  onMessage?: (data: unknown) => void;
  onError?: (err: Event) => void;
}

export function useSSE(url: string, options: SSEOptions = {}) {
  const { enabled = true, onMessage, onError } = options;
  const esRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    const token = localStorage.getItem("cyberai_token");
    if (!token) return;

    // Close existing connection
    esRef.current?.close();

    const fullUrl = `${url}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(fullUrl);
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onMessage?.(data);
      } catch {}
    };

    es.onerror = (err) => {
      setConnected(false);
      onError?.(err);
      es.close();
      // Reconnect after 5s
      reconnectTimer.current = setTimeout(connect, 5000);
    };
  }, [url, enabled, onMessage, onError]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      setConnected(false);
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    esRef.current?.close();
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    setConnected(false);
  }, []);

  return { connected, disconnect };
}
