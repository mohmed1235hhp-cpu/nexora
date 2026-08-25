import { usePipeline } from "../hooks/usePipeline";
export function PreviewScreen() {
  const { buildId } = usePipeline();
  const url = buildId ? `/app-builder/preview/${buildId}` : "";
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-2xl font-bold">المعاينة</h1>
      {buildId ? (
        <div className="space-y-3">
          <div className="rounded border bg-muted p-2 text-xs">الرابط الداخلي: <code>{url}</code></div>
          <div className="aspect-video overflow-hidden rounded-lg border bg-card">
            <div className="flex h-full items-center justify-center text-muted-foreground">Preview placeholder — Phase 2</div>
          </div>
        </div>
      ) : (
        <div className="rounded border p-6 text-center text-muted-foreground">ابدأ توليداً أولاً من الشاشة الرئيسية.</div>
      )}
    </div>
  );
}
