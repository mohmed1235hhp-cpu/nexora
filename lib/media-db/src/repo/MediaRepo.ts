import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { mediaAssets, mediaHistory, mediaJobs, type MediaJob } from "../schema/media.js";

export type Db = ReturnType<typeof drizzle>;

export function createDb(url: string = process.env["DATABASE_URL"] ?? ""): Db {
  if (!url) throw new Error("DATABASE_URL missing");
  return drizzle(postgres(url, { max: 10 }));
}

export class MediaRepo {
  constructor(private readonly db: Db) {}

  async createJob(row: Omit<MediaJob, "id" | "createdAt" | "startedAt" | "finishedAt" | "output" | "error" | "progress"> & { progress?: number }) {
    const [job] = await this.db.insert(mediaJobs).values({ ...row, progress: row.progress ?? 0 }).returning();
    return job!;
  }
  async updateJob(id: string, patch: Partial<MediaJob>) {
    await this.db.update(mediaJobs).set(patch).where(eq(mediaJobs.id, id));
  }
  async getJob(id: string, userId: string) {
    const rows = await this.db.select().from(mediaJobs).where(and(eq(mediaJobs.id, id), eq(mediaJobs.userId, userId))).limit(1);
    return rows[0] ?? null;
  }
  async listHistory(userId: string, limit = 50) {
    return this.db.select().from(mediaHistory).where(eq(mediaHistory.userId, userId)).orderBy(desc(mediaHistory.createdAt)).limit(limit);
  }
  async recordHistory(row: typeof mediaHistory.$inferInsert) {
    await this.db.insert(mediaHistory).values(row);
  }
  async saveAsset(row: typeof mediaAssets.$inferInsert) {
    const [a] = await this.db.insert(mediaAssets).values(row).returning();
    return a!;
  }
}
