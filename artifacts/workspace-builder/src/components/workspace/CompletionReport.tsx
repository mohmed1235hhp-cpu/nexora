import { Link } from "@tanstack/react-router";
import { CheckCircle2, Copy, Download, Edit3, ExternalLink, Share2 } from "lucide-react";
import { duplicateProject, type StoredProject } from "@/lib/workspace/projects-store";
import { useState } from "react";

interface Props {
  project: StoredProject;
  onStartOver: () => void;
  ar: boolean;
}

export function CompletionReport({ project, onStartOver, ar }: Props) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/project/${project.id}` : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: project.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch { /* user cancelled */ }
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9]+/gi, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dup = () => {
    duplicateProject(project.id);
    onStartOver();
  };

  return (
    <div dir={ar ? "rtl" : "ltr"} className="w-full max-w-4xl mx-auto animate-scale-in">
      <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-6 border-b border-border/60 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-500 grid place-items-center">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">
              {ar ? "اكتمل بنجاح" : "Completed"}
            </div>
            <h2 className="text-xl font-semibold">{project.name}</h2>
          </div>
        </div>

        <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          <Stat label={ar ? "تاريخ الإنشاء" : "Created"} value={new Date(project.createdAt).toLocaleString(ar ? "ar" : undefined)} />
          <Stat label={ar ? "مدة التنفيذ" : "Execution time"} value={`${(project.executionMs / 1000).toFixed(1)}s`} />
          <Stat label={ar ? "المهام المنجزة" : "Tasks completed"} value={String(project.tasksCompleted)} />
          <Stat label={ar ? "جودة" : "Quality"} value={`${project.qualityScore}/100`} />
          <Stat label={ar ? "أداء" : "Performance"} value={`${project.performanceScore}/100`} />
          <Stat label={ar ? "الأمان" : "Security"} value={project.securityStatus === "passed" ? (ar ? "ناجح" : "Passed") : project.securityStatus} />
        </dl>

        {project.previewUrl && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {ar ? "المعاينة المباشرة" : "Live Preview"}
              </div>
              <a
                href={project.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                {ar ? "فتح في نافذة" : "Open in new tab"}
              </a>
            </div>
            <iframe
              src={project.previewUrl}
              title="Project preview"
              sandbox="allow-scripts allow-forms allow-modals"
              className="w-full min-h-[520px] rounded-2xl border border-border/60 bg-white"
            />
          </div>
        )}

        <div className="px-6 pb-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {ar ? "الوكلاء المستخدمون" : "Agents used"}
          </div>
          <div className="flex flex-wrap gap-2">
            {project.agentsUsed.map((a) => (
              <span key={a} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                {a}
              </span>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {ar ? "الملفات المولّدة" : "Files generated"}
          </div>
          <ul className="grid sm:grid-cols-2 gap-1.5 text-sm">
            {project.files.map((f) => (
              <li key={f} className="rounded-md bg-muted/50 px-3 py-1.5 font-mono text-xs">{f}</li>
            ))}
          </ul>
        </div>

        <div className="px-6 py-4 border-t border-border/60 flex flex-wrap gap-2 justify-end">
          <Link
            to="/project/$id"
            params={{ id: project.id }}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            <ExternalLink className="h-4 w-4" /> {ar ? "فتح المشروع" : "Open project"}
          </Link>
          <button onClick={onStartOver} className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-sm hover:opacity-90 transition">
            <Edit3 className="h-4 w-4" /> {ar ? "متابعة التعديل" : "Continue editing"}
          </button>
          <button onClick={dup} className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-sm hover:opacity-90 transition">
            <Copy className="h-4 w-4" /> {ar ? "نسخ" : "Duplicate"}
          </button>
          <button onClick={share} className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-sm hover:opacity-90 transition">
            <Share2 className="h-4 w-4" /> {copied ? (ar ? "تم النسخ" : "Copied") : ar ? "مشاركة" : "Share"}
          </button>
          <button onClick={download} className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-sm hover:opacity-90 transition">
            <Download className="h-4 w-4" /> {ar ? "تنزيل" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
