export interface MemoryEntry<T = unknown> {
  key: string;
  value: T;
  scope: "short" | "long" | "conversation" | "temporary" | "project";
  ttlMs?: number;
  createdAt: string;
}
