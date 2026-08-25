export type StreamEventType = "start" | "chunk" | "progress" | "end" | "error" | "cancelled";

export interface StreamEvent<T = unknown> {
  type: StreamEventType;
  data?: T;
  error?: string;
  progress?: number; // 0..1
}

export type StreamHandler<T = unknown> = (event: StreamEvent<T>) => void;
