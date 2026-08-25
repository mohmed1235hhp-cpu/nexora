import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, useLang } from "@/components/workspace/AppShell";
import { listProjects, type StoredProject } from "@/lib/workspace/projects-store";
import { Award, Sparkles, Trophy } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Cyber AI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const [projects, setProjects] = useState<StoredProject[]>([]);
  useEffect(() => {
    setProjects(listProjects());
  }, []);

  const totalQuality = projects.length
    ? Math.round(projects.reduce((n, p) => n + p.qualityScore, 0) / projects.length)
    : 0;

  return (
    <AppShell>
      <div dir={ar ? "rtl" : "ltr"} className="max-w-4xl mx-auto">
        <div className="rounded-3xl overflow-hidden border border-border/60">
          <div className="h-40 bg-gradient-to-r from-primary via-chart-4 to-chart-2 relative">
            <div className="absolute -bottom-10 start-6 h-20 w-20 rounded-2xl bg-card border-4 border-background grid place-items-center text-2xl font-semibold">
              A
            </div>
          </div>
          <div className="pt-12 pb-6 px-6 bg-card/60 backdrop-blur">
            <div className="text-lg font-semibold">{ar ? "أنت" : "You"}</div>
            <div className="text-sm text-muted-foreground">{ar ? "منشئ في منصة Cyber AI" : "Creator on Cyber AI"}</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <Stat icon={<Sparkles className="h-4 w-4" />} label={ar ? "المشاريع" : "Projects"} value={String(projects.length)} />
          <Stat icon={<Trophy className="h-4 w-4" />} label={ar ? "متوسط الجودة" : "Avg. quality"} value={`${totalQuality}/100`} />
          <Stat icon={<Award className="h-4 w-4" />} label={ar ? "الإنجازات" : "Achievements"} value={String(Math.min(projects.length, 5))} />
        </div>

        <div className="mt-6 rounded-3xl border border-border/60 bg-card/60 backdrop-blur p-6">
          <h2 className="text-lg font-semibold mb-3">{ar ? "أحدث الأعمال" : "Recent work"}</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ar ? "لا يوجد أعمال بعد." : "No work yet."}</p>
          ) : (
            <ul className="space-y-2">
              {projects.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm border-b border-border/40 last:border-0 pb-2">
                  <span className="truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ms-3">{p.qualityScore}/100</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">{icon}{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
