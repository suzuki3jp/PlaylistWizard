import { and, eq, lt, sql } from "drizzle-orm";
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

  async completeAndCheckOperation(
    jobId: string,
    opIndex: number,
  ): Promise<{ completed: boolean }> {
    const result = await this.db.execute(sql`
      UPDATE jobs
      SET
        result = jsonb_set(
          result,
          '{completedOpIndices}',
          coalesce(result->'completedOpIndices', '[]'::jsonb) || jsonb_build_array(${opIndex}::int)
        ),
        status = CASE
          WHEN jsonb_array_length(coalesce(result->'completedOpIndices', '[]'::jsonb)) + 1 >= total_op_count
          THEN 'completed'::job_status
          ELSE status
        END,
        updated_at = NOW()
      WHERE id = ${jobId}
      AND NOT (coalesce(result->'completedOpIndices', '[]'::jsonb) @> jsonb_build_array(${opIndex}::int))
      RETURNING status
    `);
    const rows = result as unknown as Array<{ status: string }>;
    if (rows.length === 0) return { completed: false };
    return { completed: rows[0].status === "completed" };
  }

  async completeCreatePlaylistOperation(
    jobId: string,
    opIndex: number,
    createdPlaylistId: string,
  ): Promise<{ completed: boolean }> {
    const result = await this.db.execute(sql`
      UPDATE jobs
      SET
        result = CASE
          WHEN coalesce(result, '{}'::jsonb) ? 'createdPlaylistId' THEN
            jsonb_set(
              coalesce(result, '{"completedOpIndices":[]}'::jsonb),
              '{completedOpIndices}',
              CASE
                WHEN coalesce(result->'completedOpIndices', '[]'::jsonb) @> jsonb_build_array(${opIndex}::int)
                THEN coalesce(result->'completedOpIndices', '[]'::jsonb)
                ELSE coalesce(result->'completedOpIndices', '[]'::jsonb) || jsonb_build_array(${opIndex}::int)
              END
            )
          ELSE
            jsonb_set(
              jsonb_set(
                coalesce(result, '{"completedOpIndices":[]}'::jsonb),
                '{completedOpIndices}',
                CASE
                  WHEN coalesce(result->'completedOpIndices', '[]'::jsonb) @> jsonb_build_array(${opIndex}::int)
                  THEN coalesce(result->'completedOpIndices', '[]'::jsonb)
                  ELSE coalesce(result->'completedOpIndices', '[]'::jsonb) || jsonb_build_array(${opIndex}::int)
                END
              ),
              '{createdPlaylistId}',
              to_jsonb(${createdPlaylistId}::text)
            )
        END,
        status = CASE
          WHEN NOT (coalesce(result->'completedOpIndices', '[]'::jsonb) @> jsonb_build_array(${opIndex}::int))
           AND jsonb_array_length(coalesce(result->'completedOpIndices', '[]'::jsonb)) + 1 >= total_op_count
          THEN 'completed'::job_status
          ELSE status
        END,
        updated_at = NOW()
      WHERE id = ${jobId}
      RETURNING status
    `);
    const rows = result as unknown as Array<{ status: string }>;
    return { completed: rows.length > 0 && rows[0].status === "completed" };
  }

  async getStaleJobs(): Promise<JobRow[]> {
    return this.db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.status, "processing"),
          lt(
            jobs.updatedAt,
            sql`NOW() - INTERVAL '1 minute' * GREATEST(30, ${jobs.totalOpCount} * 0.5)`,
          ),
        ),
      );
  }
}

export const jobsDbRepository = new JobsDbRepository(dbInstance);
