import { create } from "zustand";
export interface StageState { key: string; status: "pending"|"running"|"done"|"error"; startedAt?: number; endedAt?: number; error?: string; }
export interface PipelineStoreState {
  buildId: string | null;
  stages: Record<string, StageState>;
  filesGenerated: number;
  errorsFixed: number;
  currentAgent: string | null;
  setBuildId: (id: string | null) => void;
  markStage: (key: string, patch: Partial<StageState>) => void;
  bumpFiles: (n?: number) => void;
  bumpErrors: (n?: number) => void;
  setCurrentAgent: (name: string | null) => void;
  reset: () => void;
}
export const usePipelineStore = create<PipelineStoreState>((set) => ({
  buildId: null, stages: {}, filesGenerated: 0, errorsFixed: 0, currentAgent: null,
  setBuildId: (buildId) => set({ buildId }),
  markStage: (key, patch) => set((s) => ({ stages: { ...s.stages, [key]: { ...(s.stages[key] ?? { key, status: "pending" as const }), ...patch } } })),
  bumpFiles: (n = 1) => set((s) => ({ filesGenerated: s.filesGenerated + n })),
  bumpErrors: (n = 1) => set((s) => ({ errorsFixed: s.errorsFixed + n })),
  setCurrentAgent: (currentAgent) => set({ currentAgent }),
  reset: () => set({ buildId: null, stages: {}, filesGenerated: 0, errorsFixed: 0, currentAgent: null }),
}));
