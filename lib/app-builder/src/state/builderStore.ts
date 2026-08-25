import { create } from "zustand";
import type { AppRequest, AppType } from "../core/types";
import { uid } from "../utils/id";
export interface BuilderState {
  request: AppRequest | null;
  setDescription: (d: string) => void;
  setType: (t: AppType) => void;
  reset: () => void;
}
export const useBuilderStore = create<BuilderState>((set) => ({
  request: null,
  setDescription: (description) => set((s) => ({
    request: { id: s.request?.id ?? uid("req"), description, type: s.request?.type ?? "pwa", createdAt: Date.now(), updatedAt: Date.now() } as unknown as AppRequest,
  })),
  setType: (type) => set((s) => ({
    request: { id: s.request?.id ?? uid("req"), description: s.request?.description ?? "", type, createdAt: Date.now(), updatedAt: Date.now() } as unknown as AppRequest,
  })),
  reset: () => set({ request: null }),
}));
