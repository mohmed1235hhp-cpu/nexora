export type TimelinePhase =
  | "analyzing"
  | "planning"
  | "researching"
  | "designing"
  | "coding"
  | "file-operations"
  | "image-processing"
  | "voice-processing"
  | "testing"
  | "reviewing"
  | "debugging"
  | "building"
  | "preparing"
  | "deploying"
  | "reporting"
  | "completed";

export type TimelineStatus = "pending" | "in-progress" | "completed" | "failed";

export interface TimelineEventData {
  id: string;
  phase: TimelinePhase;
  status: TimelineStatus;
  agentId?: string;
  timestamp: number;
  message?: string;
  progress?: number;
  filesCount?: number;
  errorsCount?: number;
}

export interface TimelineEntry extends TimelineEventData {
  durationMs?: number;
}
