import { usePipeline } from "../hooks/usePipeline";
export function ReportsScreen() {
  const { buildId, filesGenerated, errorsFixed, stages } = usePipeline();
  const done = Object.values(stages).filter((s) => s.status === "done").length;
  const total = Object.keys(stages).length || 20;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold">التقرير النهائي</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card label="Build" value={buildId ?? "—"} />
        <Card label="ملفات مُولّدة" value={String(filesGenerated)} />
        <Card label="أخطاء مُصلحة" value={String(errorsFixed)} />
        <Card label="مراحل مكتملة" value={`${done}/${total}`} />
        <Card label="جاهزية الإنتاج" value={`${Math.round((done/total)*100)}%`} />
      </div>
    </div>
  );
}
function Card({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>;
}
