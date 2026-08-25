import { useEffect, useMemo, useState } from "react";
import { ArrowUp, CheckCircle2, Code2, Loader2, Sparkles, Wand2 } from "lucide-react";
import { PreviewPane } from "@/components/workspace/PreviewPane";
import { saveProject, type StoredProject } from "@/lib/workspace/projects-store";
import { detectKind } from "@/lib/workspace/agent-scripts";

interface Props {
  prompt: string;
  ar: boolean;
  onDone: (project: StoredProject) => void;
  onCancel: () => void;
}

type Message = { role: "user" | "assistant"; text: string };

// The API enforces double-submit CSRF for any unsafe request once a session
// cookie exists (see artifacts/api-server/src/middlewares/csrf.ts) — it reads
// this non-httpOnly cookie back as a header to prove the request came from
// our own page. Anonymous/guest requests have no session cookie yet, so the
// server skips the check for them; that's why this was easy to miss in
// testing while logged out, but every logged-in build/edit request was
// silently failing with 403 csrf_failed.
function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith("csrf_token="));
  return match ? decodeURIComponent(match.slice("csrf_token=".length)) : null;
}

export function BuilderWorkspace({ prompt: initialPrompt, ar, onDone, onCancel }: Props) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "user", text: initialPrompt }]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [project, setProject] = useState<StoredProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const kind = useMemo(() => detectKind(initialPrompt), [initialPrompt]);

  const build = async (instruction: string, isFirst = false) => {
    setLoading(true);
    setError(null);
    if (!isFirst) setMessages((m) => [...m, { role: "user", text: instruction }]);
    try {
      const csrfToken = readCsrfCookie();
      const response = await fetch("/api/ai/builder", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({
          prompt: isFirst ? initialPrompt : instruction,
          previousCode: project?.previewCode ?? "",
          previousFiles: project?.filesContent ?? [],
          kind,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || (ar ? "تعذر بناء المشروع." : "Build failed."));
      setPreviewUrl(data.previewUrl);
      const next: StoredProject = {
        id: project?.id ?? crypto.randomUUID(),
        name: data.name || (initialPrompt.length > 60 ? initialPrompt.slice(0, 57) + "..." : initialPrompt),
        prompt: initialPrompt,
        kind,
        status: "completed",
        createdAt: project?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        version: (project?.version ?? 0) + 1,
        progress: 100,
        agentsUsed: ["AI Builder", "Browser Runtime"],
        tasksCompleted: data.tasksCompleted ?? 0,
        files: data.files?.map((f: { path: string }) => f.path) ?? ["index.html"],
        filesContent: data.files ?? [],
        executionMs: data.executionMs ?? 0,
        previewUrl: data.previewUrl,
        previewCode: data.code,
      };
      setProject(next);
      saveProject(next);
      setMessages((m) => [...m, { role: "assistant", text: isFirst ? (ar ? "تم بناء المشروع وتشغيل المعاينة." : "Project built and preview is running.") : (ar ? "تم تطبيق التعديل وتحديث المعاينة." : "Changes applied and preview updated.") }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : (ar ? "حدث خطأ غير متوقع." : "Unexpected error.");
      setError(msg);
      setMessages((m) => [...m, { role: "assistant", text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  // Start the first build once the workspace opens.
  useEffect(() => {
    void build(initialPrompt, true);
    // Initial build is intentionally run once for this workspace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = () => {
    const value = prompt.trim();
    if (!value || loading) return;
    setPrompt("");
    void build(value);
  };

  return (
    <div dir={ar ? "rtl" : "ltr"} className="w-full max-w-7xl mx-auto animate-fade-in">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center"><Wand2 className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold truncate">{ar ? "منشئ التطبيقات الذكي" : "AI Builder"}</h2>
          <p className="text-xs text-muted-foreground">{ar ? "ابنِ وعدّل وشاهد النتيجة هنا مباشرة." : "Build, edit and see the result here."}</p>
        </div>
        {project && (
          <button
            onClick={() => onDone(project)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> {ar ? "حفظ وإنهاء" : "Save & finish"}
          </button>
        )}
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">{ar ? "خروج" : "Exit"}</button>
      </div>

      <div className="grid lg:grid-cols-[360px_minmax(0,1fr)] gap-4 items-stretch">
        <aside className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col min-h-[560px]">
          <div className="p-4 border-b border-border/60 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{ar ? "محادثة البناء" : "Build chat"}</span>
            {loading && <span className="ms-auto text-[10px] rounded-full bg-primary/10 text-primary px-2 py-1">{ar ? "يعمل الآن" : "Running"}</span>}
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-auto">
            {messages.map((m, i) => (
              <div key={i} className={`rounded-2xl p-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground ms-6" : "bg-secondary me-3"}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="rounded-2xl bg-secondary p-3 text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {ar ? "جاري بناء المشروع وتشغيل المعاينة..." : "Building project and starting preview..."}
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
            )}
            {project && !loading && (
              <div className="flex items-center gap-2 text-xs text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
                {ar ? "المعاينة تعمل الآن" : "Preview is running"}
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border/60">
            <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-background/50 p-2 focus-within:border-primary/50">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                rows={2}
                placeholder={ar ? "عدّل شيئًا... مثال: اجعل اللون أزرق" : "Ask for a change... e.g. make it blue"}
                className="min-w-0 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none"
              />
              <button onClick={submit} disabled={!prompt.trim() || loading} className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center disabled:opacity-40">
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <PreviewPane src={previewUrl} loading={loading} ar={ar} />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Code2 className="h-3.5 w-3.5" />
        {ar ? "المعاينة تعمل داخل التطبيق في بيئة iframe معزولة." : "Preview runs inside the app in an isolated iframe."}
      </div>
    </div>
  );
}
