import { useTimeline } from "../hooks/useTimeline";
import { usePipeline } from "../hooks/usePipeline";
export function TimelineScreen() {
  const stages = useTimeline();
  const { filesGenerated, errorsFixed, currentAgent, buildId } = usePipeline();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold">الخط الزمني</h1>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Build ID" value={buildId ?? "—"} />
        <Stat label="ملفات" value={String(filesGenerated)} />
        <Stat label="أخطاء مُصلحة" value={String(errorsFixed)} />
        <Stat label="Agent الحالي" value={currentAgent ?? "—"} />
      </div>
      <ol className="flex flex-col gap-2">
        {stages.map((s) => {
          const status = s.state?.status ?? "pending";
          const color = status === "done" ? "bg-emerald-500" : status === "running" ? "bg-blue-500 animate-pulse" : status === "error" ? "bg-red-500" : "bg-muted";
          return (
            <li key={s.key} className="flex items-center gap-3 rounded-md border p-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
              <span className="text-lg">{s.emoji}</span>
              <span className="flex-1 text-sm">{s.label}</span>
              <span className="text-xs text-muted-foreground">{status}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="truncate text-sm font-semibold">{value}</div></div>;
}
