import type { BuildQueue, BuildJob } from "./BuildQueue";
import type { BuildRunner } from "./BuildRunner";

export class BuildWorker {
  private running = false;
  constructor(private queue: BuildQueue, private runner: BuildRunner) {}

  async tick(): Promise<BuildJob | undefined> {
    if (this.running) return undefined;
    const job = this.queue.next();
    if (!job) return undefined;
    this.running = true;
    this.queue.update(job.id, { status: "running" });
    try {
      await this.runner.run(job);
      this.queue.update(job.id, { status: "done" });
    } catch {
      this.queue.update(job.id, { status: "failed" });
    } finally {
      this.running = false;
    }
    return job;
  }
}
