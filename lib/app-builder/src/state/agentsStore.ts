import { create } from "zustand";
export interface AgentRun { name: string; status: "idle"|"running"|"done"|"error"; startedAt?: number; endedAt?: number; }
interface AgentsState { runs: Record<string, AgentRun>; setRun: (name: string, patch: Partial<AgentRun>) => void; }
export const useAgentsStore = create<AgentsState>((set) => ({
  runs: {},
  setRun: (name, patch) => set((s) => ({ runs: { ...s.runs, [name]: { ...(s.runs[name] ?? { name, status: "idle" as const }), ...patch } } })),
}));
