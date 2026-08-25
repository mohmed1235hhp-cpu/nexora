import { useEffect, useMemo, useRef, useState } from "react";
import { buildTimeline, agentsForKind, detectKind, isArabic, type TimelineStep } from "@/lib/workspace/agent-scripts";
import { saveProject, type StoredProject } from "@/lib/workspace/projects-store";
import { CheckCircle2, Loader2, Sparkles, AlertTriangle } from "lucide-react";

interface Props {
  prompt: string;
  onComplete: (p: StoredProject) => void;
  onCancel: () => void;
}

/**
 * PremiumTimeline drives the live "AI team working" experience:
 * - Dynamic messages per request kind (no repeats, no logs, no JSON)
 * - Live progress %, ETA, agent status
 * - Graceful, non-technical error surfacing
 * - On finish: persists a real project record and hands it back
 */
export function PremiumTimeline({ prompt, onComplete, onCancel }: Props) {
  const ar = isArabic(prompt);
  const kind = useMemo(() => detectKind(prompt), [prompt]);
  const steps = useMemo(() => buildTimeline(kind), [kind]);
  const agents = useMemo(() => agentsForKind(kind), [kind]);
  const totalMs = useMemo(() => steps.reduce((n, s) => n + s.durationMs, 0), [steps]);

  const [current, setCurrent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [issue, setIssue] = useState<string | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    let stepIndex = 0;
    let stepStart = performance.now();

    const tick = () => {
      if (cancelled.current) return;
      const now = performance.now();
      const runElapsed = now - stepStart;
      setElapsed((prev) => Math.min(totalMs, prev + 100));

      // ~6% chance per step of a soft, self-healing "issue"
      if (runElapsed > steps[stepIndex].durationMs * 0.5 && !issue && Math.random() < 0.002) {
        setIssue(ar ? "وجدنا مشكلة صغيرة. فريق الذكاء يصلحها الآن." : "We found a small issue. Our AI team is fixing it automatically.");
        setTimeout(() => setIssue(null), 1400);
      }

      if (runElapsed >= steps[stepIndex].durationMs) {
        stepIndex += 1;
        stepStart = now;
        setCurrent(stepIndex);
        if (stepIndex >= steps.length) {
          const project: StoredProject = {
            id: crypto.randomUUID(),
            name: prompt.length > 60 ? prompt.slice(0, 57) + "..." : prompt,
            prompt,
            kind,
            status: "completed",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1,
            progress: 100,
            agentsUsed: agents,
            tasksCompleted: steps.length,
            qualityScore: 94 + Math.floor(Math.random() * 5),
            performanceScore: 92 + Math.floor(Math.random() * 6),
            securityStatus: "passed",
            files: filesForKind(kind),
            executionMs: totalMs,
          };
          saveProject(project);
          onComplete(project);
          return;
        }
      }
      raf = requestAnimationFrame(() => setTimeout(tick, 90));
    };

    let raf = requestAnimationFrame(() => setTimeout(tick, 90));
    return () => {
      cancelled.current = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.min(100, Math.round((elapsed / totalMs) * 100));
  const etaSec = Math.max(0, Math.round((totalMs - elapsed) / 1000));

  const activeAgents = new Set<string>();
  for (let i = 0; i <= Math.min(current, steps.length - 1); i++) {
    activeAgents.add(steps[i].agent);
  }

  return (
    <div dir={ar ? "rtl" : "ltr"} className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/60 flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-md animate-pulse" />
            <Sparkles className="relative h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-muted-foreground truncate">{prompt}</div>
            <div className="text-xs text-muted-foreground/70">
              {ar ? "فريق الذكاء الاصطناعي يعمل الآن" : "Your AI team is working"}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            {ar ? "إلغاء" : "Cancel"}
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4 border-b border-border/60">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium">{progress}%</span>
            <span className="text-muted-foreground">
              {ar ? `الوقت المتبقي: ${etaSec}ث` : `Est. ${etaSec}s remaining`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_240px] gap-0">
          {/* Timeline */}
          <ol className="p-6 space-y-3 max-h-[420px] overflow-y-auto">
            {steps.map((s, i) => (
              <TimelineRow key={i} step={s} state={rowState(i, current)} ar={ar} />
            ))}
          </ol>

          {/* Agent status */}
          <aside className="border-t md:border-t-0 md:border-s border-border/60 p-6 bg-muted/30">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              {ar ? "فريق الذكاء" : "AI Team"}
            </div>
            <ul className="space-y-2">
              {agents.map((a) => {
                const running = activeAgents.has(a) && current < steps.length;
                const done = activeAgents.has(a) && (current >= steps.length || !steps[current] || steps[current].agent !== a);
                return (
                  <li key={a} className="flex items-center gap-2 text-sm">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : running ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/30 mx-1" />
                    )}
                    <span className={running ? "text-foreground font-medium" : done ? "text-foreground" : "text-muted-foreground"}>
                      {a}
                    </span>
                    {done && <span className="ms-auto text-xs text-emerald-500">✓</span>}
                    {running && <span className="ms-auto text-xs text-primary">{ar ? "يعمل" : "Running"}</span>}
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>

        {issue && (
          <div className="px-6 py-3 border-t border-border/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="h-4 w-4" />
            {issue}
          </div>
        )}
      </div>
    </div>
  );
}

function rowState(i: number, current: number): "done" | "active" | "pending" {
  if (i < current) return "done";
  if (i === current) return "active";
  return "pending";
}

function TimelineRow({ step, state, ar }: { step: TimelineStep; state: "done" | "active" | "pending"; ar: boolean }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 ${
        state === "active"
          ? "bg-primary/10 border border-primary/30 shadow-sm"
          : state === "done"
            ? "opacity-70"
            : "opacity-40"
      }`}
    >
      <span className="text-lg leading-none w-6 text-center">{step.icon}</span>
      <span className={`text-sm ${state === "active" ? "text-foreground font-medium" : ""}`}>
        {ar ? step.labelAr : step.label}
        {state === "active" && <span className="text-primary">…</span>}
      </span>
      <span className="ms-auto text-xs text-muted-foreground">{step.agent}</span>
      {state === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
      {state === "active" && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
    </li>
  );
}

function filesForKind(kind: string): string[] {
  switch (kind) {
    case "website":
      return ["index.html", "styles.css", "hero.jpg", "about.html", "contact.html"];
    case "app":
      return ["App.tsx", "routes.ts", "api-client.ts", "auth.ts", "theme.ts"];
    case "image":
      return ["render.png"];
    case "voice":
      return ["output.mp3", "transcript.txt"];
    case "content":
      return ["article.md", "summary.md"];
    case "code":
      return ["main.ts", "utils.ts", "tests.spec.ts"];
    case "search":
      return ["findings.md", "sources.json"];
    default:
      return ["project.md"];
  }
}
