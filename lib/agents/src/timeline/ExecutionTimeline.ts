import type { TimelineEntry, TimelineEventData, TimelinePhase } from "../types/timeline.types";
import { phaseIcons, phaseLabels } from "./phaseIcons";

export class ExecutionTimeline {
  private entries: TimelineEntry[] = [];

  addEvent(event: TimelineEventData): void {
    const existing = this.entries.find(e => e.id === event.id);
    if (existing && event.status !== "in-progress") {
      existing.status = event.status;
      existing.durationMs = event.timestamp - existing.timestamp;
    } else {
      this.entries.push({ ...event });
    }
  }

  getEntries(): TimelineEntry[] {
    return [...this.entries];
  }

  getFormatted(): string[] {
    return this.entries.map(e => {
      const icon = phaseIcons[e.phase];
      const label = phaseLabels[e.phase];
      const status = e.status === "completed" ? "✓" : e.status === "failed" ? "✗" : "…";
      return `${icon} ${label} [${status}] ${e.message ?? ""}`.trim();
    });
  }

  getPhaseStatus(phase: TimelinePhase): "pending" | "in-progress" | "completed" | "failed" {
    const entries = this.entries.filter(e => e.phase === phase);
    if (entries.length === 0) return "pending";
    if (entries.some(e => e.status === "failed")) return "failed";
    if (entries.every(e => e.status === "completed")) return "completed";
    return "in-progress";
  }

  clear(): void {
    this.entries = [];
  }
}
