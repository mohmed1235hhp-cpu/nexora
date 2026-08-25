export interface BuildJob {
  id: string;
  spec: Record<string, unknown>;
  createdAt: number;
  status: "queued" | "running" | "done" | "failed";
}

export class BuildQueue {
  private jobs = new Map<string, BuildJob>();
  private order: string[] = [];

  enqueue(job: BuildJob) {
    this.jobs.set(job.id, job);
    this.order.push(job.id);
  }

  next(): BuildJob | undefined {
    for (const id of this.order) {
      const j = this.jobs.get(id);
      if (j && j.status === "queued") return j;
    }
    return undefined;
  }

  update(id: string, patch: Partial<BuildJob>) {
    const j = this.jobs.get(id);
    if (!j) return;
    this.jobs.set(id, { ...j, ...patch });
  }

  get(id: string) { return this.jobs.get(id); }
  all() { return Array.from(this.jobs.values()); }
}

export const globalBuildQueue = new BuildQueue();
