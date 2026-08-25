import { useAgentsStore } from "../state/agentsStore";
export const useAgent = (name: string) => useAgentsStore((s) => s.runs[name]);
