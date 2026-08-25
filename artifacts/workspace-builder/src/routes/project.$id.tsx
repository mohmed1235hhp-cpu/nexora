import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, useLang } from "@/components/workspace/AppShell";
import { getProject, type StoredProject } from "@/lib/workspace/projects-store";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/project/$id")({
  head: () => ({ meta: [{ title: "Project — Cyber AI" }] }),
  component: ProjectPage,
});

function ProjectPage() {
  const { id } = useParams({ from: "/project/$id" });
  const { lang } = useLang();
  const ar = lang === "ar";
  const [project, setProject] = useState<StoredProject | null>(null);

  useEffect(() => {
    setProject(getProject(id));
  }, [id]);

  return (
    <AppShell>
      <div dir={ar ? "rtl" : "ltr"} className="max-w-4xl mx-auto">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> {ar ? "كل المشاريع" : "All projects"}
        </Link>
        {!project ? (
          <div className="rounded-2xl border border-border/60 bg-card/60 p-8 text-center">
            <p>{ar ? "لم يتم العثور على المشروع." : "Project not found."}</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border/60">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{project.kind}</div>
              <h1 className="text-2xl font-semibold mt-1">{project.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{project.prompt}</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 p-6">
              <Stat label={ar ? "جودة" : "Quality"} value={`${project.qualityScore}/100`} />
              <Stat label={ar ? "أداء" : "Performance"} value={`${project.performanceScore}/100`} />
              <Stat label={ar ? "الأمان" : "Security"} value={project.securityStatus} />
            </div>
            {project.previewUrl && (
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {ar ? "المعاينة" : "Preview"}
                  </div>
                  <a
                    href={project.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> {ar ? "فتح" : "Open"}
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

            <div className="px-6 pb-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                {ar ? "الوكلاء" : "Agents"}
              </div>
              <div className="flex flex-wrap gap-2">
                {project.agentsUsed.map((a) => (
                  <span key={a} className="rounded-full bg-secondary text-secondary-foreground text-xs px-2.5 py-1">{a}</span>
                ))}
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-6 mb-2">
                {ar ? "الملفات" : "Files"}
              </div>
              <ul className="grid sm:grid-cols-2 gap-1.5">
                {project.files.map((f) => (
                  <li key={f} className="rounded-md bg-muted/50 px-3 py-1.5 font-mono text-xs">{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold capitalize">{value}</div>
    </div>
  );
}
