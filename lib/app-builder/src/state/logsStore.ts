import { create } from "zustand";
export interface LogItem { id: string; ts: number; level: "info"|"warn"|"error"; msg: string; }
export interface LogsState { items: LogItem[]; push: (l: Omit<LogItem,"id"|"ts">) => void; clear: () => void; }
export const useLogsStore = create<LogsState>((set) => ({
  items: [],
  push: (l) => set((s) => ({ items: [...s.items.slice(-499), { ...l, id: Math.random().toString(36).slice(2), ts: Date.now() }] })),
  clear: () => set({ items: [] }),
}));
