import { and, eq, sql } from "drizzle-orm";
import type { UserId } from "@/entities/ids";
import { db as dbInstance } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import type {
  JobOperation,
  JobResult,
  JobStatus,
  JobType,
} from "@/lib/schemas/jobs";

type Db = typeof dbInstance;

export type JobRow = typeof jobs.$inferSelect;

export type CreateJobData = {
  userId: UserId;
  accId: string;
  type: JobType;
  operations: JobOperation[];
  totalOpCount: number;
};

export class JobsDbRepository {
  constructor(private db: Db) {}

  async createJob(data: CreateJobData): Promise<JobRow> {
    const [row] = await this.db
      .insert(jobs)
      .values({
        userId: data.userId,
        accId: data.accId,
        type: data.type,
        payload: { operations: data.operations },
        totalOpCount: data.totalOpCount,
      })
      .returning();
    return row;
  }

  async getJob(jobId: string, userId?: UserId): Promise<JobRow | null> {
    const row = userId
      ? await this.db.query.jobs.findFirst({
          where: and(eq(jobs.id, jobId), eq(jobs.userId, userId)),
        })
      : await this.db.query.jobs.findFirst({
          where: eq(jobs.id, jobId),
        });
    return row ?? null;
  }

  async getJobByWorker(jobId: string): Promise<JobRow | null> {
    const row = await this.db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
    });
    return row ?? null;
  }

  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    error?: string,
  ): Promise<void> {
    await this.db
      .update(jobs)
      .set({ status, error: error ?? null })
      .where(eq(jobs.id, jobId));
  }

  async updateJobResult(jobId: string, result: JobResult): Promise<void> {
    await this.db.update(jobs).set({ result }).where(eq(jobs.id, jobId));
  }

  async completeOperation(jobId: string, opIndex: number): Promise<void> {
    const job = await this.getJobByWorker(jobId);
    if (!job) return;
    const current = job.result ?? { completedOpIndices: [] };
    const existing = current.completedOpIndices ?? [];
    if (existing.includes(opIndex)) return;
    await this.db
      .update(jobs)
      .set({
        result: { ...current, completedOpIndices: [...existing, opIndex] },
      })
      .where(eq(jobs.id, jobId));
  }

  async getStaleJobs(): Promise<JobRow[]> {
    const rows = await this.db.execute(sql`
      SELECT * FROM jobs
      WHERE status = 'processing'
      AND updated_at < NOW() - INTERVAL '1 minute' * GREATEST(30, total_op_count * 0.5)
    `);
    return rows as unknown as JobRow[];
  }
}

export const jobsDbRepository = new JobsDbRepository(dbInstance);
