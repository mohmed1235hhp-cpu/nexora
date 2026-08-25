// Client-side projects store. Uses localStorage so projects survive reloads.
// No fake data — every project comes from a real user submission.

export interface StoredProject {
  id: string;
  name: string;
  prompt: string;
  kind: string;
  status: "completed" | "in_progress" | "issue";
  createdAt: number;
  updatedAt: number;
  version: number;
  progress: number;
  agentsUsed: string[];
  tasksCompleted: number;
  qualityScore: number;
  performanceScore: number;
  securityStatus: "passed" | "review" | "failed";
  files: string[];
  executionMs: number;
  /** Internal preview state for the in-app Lovable-style builder. */
  previewUrl?: string;
  previewCode?: string;
  filesContent?: Array<{ path: string; content: string }>;
}

const KEY = "cyberai.projects.v1";

function safeRead(): StoredProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredProject[]) : [];
  } catch {
    return [];
  }
}

function safeWrite(list: StoredProject[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("cyberai:projects-changed"));
  } catch {
    /* quota / private mode — silent, non-blocking */
  }
}

export function listProjects(): StoredProject[] {
  return safeRead().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveProject(p: StoredProject) {
  const list = safeRead().filter((x) => x.id !== p.id);
  list.unshift(p);
  safeWrite(list);
}

export function deleteProject(id: string) {
  safeWrite(safeRead().filter((p) => p.id !== id));
}

export function duplicateProject(id: string): StoredProject | null {
  const src = safeRead().find((p) => p.id === id);
  if (!src) return null;
  const copy: StoredProject = {
    ...src,
    id: crypto.randomUUID(),
    name: `${src.name} (copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  };
  saveProject(copy);
  return copy;
}

export function getProject(id: string): StoredProject | null {
  return safeRead().find((p) => p.id === id) ?? null;
}
