import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, useLang } from "@/components/workspace/AppShell";
import { WorkspaceInput } from "@/components/workspace/WorkspaceInput";
import { PremiumTimeline } from "@/components/workspace/PremiumTimeline";
import { BuilderWorkspace } from "@/components/workspace/BuilderWorkspace";
import { CompletionReport } from "@/components/workspace/CompletionReport";
import type { StoredProject } from "@/lib/workspace/projects-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cyber AI — AI Workspace" },
      { name: "description", content: "Turn your idea into reality. Premium AI workspace powered by a team of collaborating AI agents." },
      { property: "og:title", content: "Cyber AI — AI Workspace" },
      { property: "og:description", content: "Turn your idea into reality with a premium AI team." },
    ],
  }),
  component: Home,
});

type Phase = { kind: "idle" } | { kind: "builder"; prompt: string } | { kind: "running"; prompt: string } | { kind: "done"; project: StoredProject };

function Home() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const { lang } = useLang();
  const ar = lang === "ar";

  return (
    <AppShell>
      <section className="min-h-[70vh] flex flex-col items-center justify-center gap-8 py-8">
        {phase.kind === "idle" && (
          <div className="w-full flex flex-col items-center gap-8 animate-fade-in">
            <div dir={ar ? "rtl" : "ltr"} className="text-center max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full aql-glow-ring bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {ar ? "29+ وكيل ذكاء يعملون معًا" : "29+ AI agents working together"}
              </div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
                <span className="bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                  {ar ? "حول فكرتك إلى" : "Turn your idea"}
                </span>
                <br />
                <span className="aql-gradient-text">
                  {ar ? "حقيقة" : "into reality."}
                </span>
              </h1>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                {ar
                  ? "اكتب ما تريد. فريق كامل من وكلاء الذكاء الاصطناعي سيبنيه لك."
                  : "Describe anything. A full AI team plans, designs, builds and ships it."}
              </p>
            </div>
            <WorkspaceInput
              language={ar ? "ar" : "en"}
              onSubmit={(prompt) => setPhase({ kind: "builder", prompt })}
            />
            <SuggestionChips
              ar={ar}
              onPick={(p) => setPhase({ kind: "builder", prompt: p })}
            />
          </div>
        )}

        {phase.kind === "builder" && (
          <BuilderWorkspace
            prompt={phase.prompt}
            ar={ar}
            onDone={(project) => setPhase({ kind: "done", project })}
            onCancel={() => setPhase({ kind: "idle" })}
          />
        )}

        {phase.kind === "running" && (
          <PremiumTimeline
            prompt={phase.prompt}
            onComplete={(project) => setPhase({ kind: "done", project })}
            onCancel={() => setPhase({ kind: "idle" })}
          />
        )}

        {phase.kind === "done" && (
          <CompletionReport
            project={phase.project}
            ar={ar}
            onStartOver={() => setPhase({ kind: "idle" })}
          />
        )}
      </section>
    </AppShell>
  );
}

function SuggestionChips({ ar, onPick }: { ar: boolean; onPick: (p: string) => void }) {
  const items = ar
    ? [
        "أنشئ موقع لمطعم إيطالي فاخر",
        "صمم تطبيق لتتبع اللياقة البدنية",
        "أنشئ تطبيق لإدارة المصروفات",
        "أنشئ لوحة تحكم SaaS احترافية",
      ]
    : [
        "Build a website for a luxury Italian restaurant",
        "Design a fitness tracking mobile app",
        "Build a personal finance app",
        "Build a professional SaaS dashboard",
      ];
  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-3xl">
      {items.map((it) => (
        <button
          key={it}
          onClick={() => onPick(it)}
          className="text-xs sm:text-sm rounded-full border border-border/60 bg-card/50 hover:bg-card px-3 py-1.5 text-muted-foreground hover:text-foreground transition-all hover:-translate-y-0.5 backdrop-blur"
        >
          {it}
        </button>
      ))}
    </div>
  );
}
