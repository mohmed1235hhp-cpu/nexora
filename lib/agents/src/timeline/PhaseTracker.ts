import type { TimelinePhase } from "../types/timeline.types";

export class PhaseTracker {
  private phaseData = new Map<TimelinePhase, { startTime: number; endTime?: number; filesCount: number; errorsCount: number }>();

  startPhase(phase: TimelinePhase): void {
    this.phaseData.set(phase, { startTime: Date.now(), filesCount: 0, errorsCount: 0 });
  }

  endPhase(phase: TimelinePhase): void {
    const data = this.phaseData.get(phase);
    if (data) data.endTime = Date.now();
  }

  addFiles(phase: TimelinePhase, count: number): void {
    const data = this.phaseData.get(phase);
    if (data) data.filesCount += count;
  }

  addErrors(phase: TimelinePhase, count: number): void {
    const data = this.phaseData.get(phase);
    if (data) data.errorsCount += count;
  }

  getPhaseData(phase: TimelinePhase) {
    return this.phaseData.get(phase);
  }

  getAllPhases() {
    return new Map(this.phaseData);
  }
}
