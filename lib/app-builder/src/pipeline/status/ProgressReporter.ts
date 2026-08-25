import type { StatusTracker, BuildStage } from "./StatusTracker";
const ORDER: BuildStage[] = [
  "queued","plan","generate","review","fix","tests","security","perf","package","report","done"
];
export function progressPercent(t: StatusTracker, jobId: string): number {
  const s = t.get(jobId); if (!s) return 0;
  const idx = ORDER.indexOf(s.stage);
  return idx < 0 ? 0 : Math.round((idx / (ORDER.length - 1)) * 100);
}
