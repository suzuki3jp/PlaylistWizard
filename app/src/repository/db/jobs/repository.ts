import { and, eq, lt, sql } from "drizzle-orm";
import type { UserId } from "@/entities/ids";
import { db as dbInstance } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import type {
  EnqueueJobRequest,
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
  payload: EnqueueJobRequest;
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
        payload: data.payload,
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
    await this.db.execute(sql`
      UPDATE jobs
      SET
        result = jsonb_set(
          result,
          '{completedOpIndices}',
          coalesce(result->'completedOpIndices', '[]'::jsonb) || jsonb_build_array(${opIndex})
        ),
        updated_at = now()
      WHERE id = ${jobId}
      AND NOT (coalesce(result->'completedOpIndices', '[]'::jsonb) @> jsonb_build_array(${opIndex}))
    `);
  }

  async getStaleJobs(threshold: Date): Promise<JobRow[]> {
    const rows = await this.db
      .select()
      .from(jobs)
      .where(and(eq(jobs.status, "processing"), lt(jobs.updatedAt, threshold)));
    return rows;
  }
}

export const jobsDbRepository = new JobsDbRepository(dbInstance);
