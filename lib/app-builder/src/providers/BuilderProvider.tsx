import { createContext, useContext, useEffect, type ReactNode } from "react";
import { bootstrapAppBuilder } from "../app/Bootstrap";
import { registerAllAgents } from "../services/router/registerAgents";
import { globalBus } from "../core/events/EventBus";
import { usePipelineStore } from "../state/pipelineStore";
import { useLogsStore } from "../state/logsStore";
import { useAgentsStore } from "../state/agentsStore";

const Ctx = createContext<{ ready: boolean }>({ ready: false });
export function BuilderProvider({ children }: { children: ReactNode }) {
  const markStage = usePipelineStore((s) => s.markStage);
  const bumpFiles = usePipelineStore((s) => s.bumpFiles);
  const pushLog = useLogsStore((s) => s.push);
  const setRun = useAgentsStore((s) => s.setRun);
  useEffect(() => {
    bootstrapAppBuilder();
    registerAllAgents();
    const offs = [
      globalBus.on<{ name: string; order: number }>("step:start", (p) => { markStage(p.name, { status: "running", startedAt: Date.now() }); pushLog({ level: "info", msg: `▶ ${p.name}` }); }),
      globalBus.on<{ name: string; order: number }>("step:done", (p) => { markStage(p.name, { status: "done", endedAt: Date.now() }); pushLog({ level: "info", msg: `✓ ${p.name}` }); bumpFiles(3); }),
      globalBus.on<{ name: string; error: string }>("step:error", (p) => { markStage(p.name, { status: "error", endedAt: Date.now(), error: p.error }); pushLog({ level: "error", msg: `✗ ${p.name}: ${p.error}` }); }),
      globalBus.on<{ name: string }>("agent:start", (p) => setRun(p.name, { status: "running", startedAt: Date.now() })),
      globalBus.on<{ name: string }>("agent:done", (p) => setRun(p.name, { status: "done", endedAt: Date.now() })),
    ];
    return () => { offs.forEach((f) => f()); };
  }, [markStage, bumpFiles, pushLog, setRun]);
  return <Ctx.Provider value={{ ready: true }}>{children}</Ctx.Provider>;
}
export const useBuilderContext = () => useContext(Ctx);
