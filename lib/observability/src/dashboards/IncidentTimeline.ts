export type TimelineStage = "detect" | "analyse" | "security" | "root-cause" | "auto-remediate" | "report";
export interface TimelineStep { readonly stage: TimelineStage; readonly ts: number; readonly icon: string; readonly note?: string; readonly data?: Readonly<Record<string, string | number | boolean>>; }
const ICONS: Record<TimelineStage, string> = { detect: "🔍", analyse: "📊", security: "🛡", "root-cause": "🧠", "auto-remediate": "🛠", report: "📄" };
const ORDER: readonly TimelineStage[] = ["detect", "analyse", "security", "root-cause", "auto-remediate", "report"];

/** Simple state machine: advance() only moves forward through the timeline. */
export class IncidentTimeline {
  private readonly steps: TimelineStep[] = [];
  private idx = -1;
  constructor(public readonly id: string) {}
  current(): TimelineStage | undefined { return this.idx >= 0 ? ORDER[this.idx] : undefined; }
  advance(stage: TimelineStage, note?: string, data?: TimelineStep["data"]): TimelineStep {
    const target = ORDER.indexOf(stage);
    if (target <= this.idx) throw new Error(`cannot regress from ${this.current()} to ${stage}`);
    this.idx = target;
    const step: TimelineStep = { stage, ts: Date.now(), icon: ICONS[stage], note, data };
    this.steps.push(step); return step;
  }
  history(): readonly TimelineStep[] { return [...this.steps]; }
  isComplete(): boolean { return this.current() === "report"; }
}
