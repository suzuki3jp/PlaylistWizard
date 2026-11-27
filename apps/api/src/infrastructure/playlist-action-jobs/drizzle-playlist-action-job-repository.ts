import { toAccountId, toUserId } from "@playlistwizard/core/ids";
import * as schema from "@playlistwizard/db";
import {
  JobStatus,
  parseBackendJob,
  StepStatus,
  StepType,
  toJobId,
  toStepId,
} from "@playlistwizard/playlist-action-job";
import * as Sentry from "@sentry/cloudflare";
import { and, eq, inArray, lt, ne, or, sql } from "drizzle-orm";
import type {
  AddPlaylistItemStepDraft,
  ExecutionStepRecord,
  PlaylistActionJobRecord,
  PlaylistActionJobRepository,
  PlaylistActionStepRecord,
} from "../../usecase/playlist-actions/ports";
import type { Db } from "../db/connection";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// Keeps each multi-row insert well below PostgreSQL's 65,535 bind parameter
// limit for large Sync plans.
const STEP_INSERT_CHUNK_SIZE = 1000;

const ACTIVE_JOB_STATUSES = [JobStatus.Pending, JobStatus.Running];
const ACTIVE_STEP_STATUSES = [StepStatus.Pending, StepStatus.Running];

export class DrizzlePlaylistActionJobRepository implements PlaylistActionJobRepository {
  constructor(private readonly db: Db) {}

  async createJobWithPlanStep(
    input: Parameters<PlaylistActionJobRepository["createJobWithPlanStep"]>[0],
  ) {
    await this.db.transaction(async (tx) => {
      await tx.insert(schema.job).values({
        accountId: input.accountId,
        completeSteps: 0,
        id: input.jobId,
        status: JobStatus.Pending,
        totalSteps: 0,
        type: input.jobType,
        userId: input.userId,
      });

      await tx.insert(schema.step).values({
        attemptCount: 0,
        id: input.planStepId,
        jobId: input.jobId,
        payload: input.planStepsPayload,
        status: StepStatus.Pending,
        type: StepType.PlanSteps,
      });
    });
  }

  async markJobEnqueueFailed(
    input: Parameters<PlaylistActionJobRepository["markJobEnqueueFailed"]>[0],
  ) {
    const now = new Date();

    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.step)
        .set({
          failedAt: now,
          lastError: input.errorMessage,
          status: StepStatus.Failed,
        })
        .where(eq(schema.step.id, input.planStepId));

      await tx
        .update(schema.job)
        .set({
          error: { message: input.errorMessage },
          status: JobStatus.Failed,
        })
        .where(eq(schema.job.id, input.jobId));
    });
  }

  async claimStep(
    input: Parameters<PlaylistActionJobRepository["claimStep"]>[0],
  ) {
    const [step] = await this.db
      .update(schema.step)
      .set({
        attemptCount: sql`${schema.step.attemptCount} + 1`,
        status: StepStatus.Running,
      })
      .where(
        and(
          eq(schema.step.id, input.stepId),
          or(
            eq(schema.step.status, StepStatus.Pending),
            and(
              eq(schema.step.status, StepStatus.Running),
              lt(schema.step.updatedAt, input.staleBefore),
            ),
          ),
        ),
      )
      .returning();

    return step ? toStepRecord(step) : null;
  }

  async isStepRunning(
    stepId: Parameters<PlaylistActionJobRepository["isStepRunning"]>[0],
  ) {
    const step = await this.db.query.step.findFirst({
      where: eq(schema.step.id, stepId),
    });

    return step?.status === StepStatus.Running;
  }

  async findStep(
    stepId: Parameters<PlaylistActionJobRepository["findStep"]>[0],
  ) {
    const step = await this.db.query.step.findFirst({
      where: eq(schema.step.id, stepId),
    });

    return step ? toStepRecord(step) : null;
  }

  async findJob(jobId: Parameters<PlaylistActionJobRepository["findJob"]>[0]) {
    const job = await this.db.query.job.findFirst({
      where: eq(schema.job.id, jobId),
    });

    return job ? toJobRecord(job) : null;
  }

  async completeStep(
    input: Parameters<PlaylistActionJobRepository["completeStep"]>[0],
  ) {
    await this.db.transaction(async (tx) => {
      await lockJob(tx, input.jobId);

      const [updated] = await tx
        .update(schema.step)
        .set({ status: StepStatus.Completed })
        .where(
          and(
            eq(schema.step.id, input.stepId),
            eq(schema.step.status, StepStatus.Running),
          ),
        )
        .returning({ type: schema.step.type });

      // A redelivered or late completion must not count twice.
      if (!updated) return;

      if (updated.type !== StepType.PlanSteps) {
        await tx
          .update(schema.job)
          .set({ completeSteps: sql`${schema.job.completeSteps} + 1` })
          .where(eq(schema.job.id, input.jobId));
      }

      await settleJob(tx, input.jobId);
    });
  }

  async failStep(
    input: Parameters<PlaylistActionJobRepository["failStep"]>[0],
  ) {
    const now = new Date();

    await this.db.transaction(async (tx) => {
      await lockJob(tx, input.jobId);

      const [failed] = await tx
        .update(schema.step)
        .set({
          failedAt: now,
          lastError: input.errorMessage,
          status: StepStatus.Failed,
        })
        .where(
          and(
            eq(schema.step.id, input.stepId),
            inArray(schema.step.status, ACTIVE_STEP_STATUSES),
          ),
        )
        .returning({ type: schema.step.type });

      if (!failed) return;

      await tx
        .update(schema.job)
        .set({ error: { message: input.errorMessage } })
        .where(eq(schema.job.id, input.jobId));

      if (failed.type === StepType.PlanSteps) {
        // Steps planned before the plan itself failed may never have been
        // enqueued. Running ones are left to finish so their Provider effects
        // are recorded.
        await tx
          .update(schema.step)
          .set({
            failedAt: now,
            lastError: "Not started because planning failed",
            status: StepStatus.Failed,
          })
          .where(
            and(
              eq(schema.step.jobId, input.jobId),
              eq(schema.step.status, StepStatus.Pending),
              ne(schema.step.type, StepType.PlanSteps),
            ),
          );
      }

      await settleJob(tx, input.jobId);
    });
  }

  async resetRunningStepToPendingWithError(
    input: Parameters<
      PlaylistActionJobRepository["resetRunningStepToPendingWithError"]
    >[0],
  ) {
    await this.db
      .update(schema.step)
      .set({
        lastError: input.errorMessage,
        status: StepStatus.Pending,
      })
      .where(
        and(
          eq(schema.step.id, input.stepId),
          eq(schema.step.status, StepStatus.Running),
        ),
      );
  }

  async findCreatePlaylistStep(
    jobId: Parameters<PlaylistActionJobRepository["findCreatePlaylistStep"]>[0],
  ) {
    const step = await this.db.query.step.findFirst({
      where: and(
        eq(schema.step.jobId, jobId),
        eq(schema.step.type, StepType.CreatePlaylist),
      ),
    });

    return step ? toStepRecord(step) : null;
  }

  async createCreatePlaylistStepAndStartJob(
    input: Parameters<
      PlaylistActionJobRepository["createCreatePlaylistStepAndStartJob"]
    >[0],
  ) {
    await this.db.transaction(async (tx) => {
      await tx.insert(schema.step).values({
        attemptCount: 0,
        id: input.stepId,
        jobId: input.jobId,
        payload: input.payload,
        status: StepStatus.Pending,
        type: StepType.CreatePlaylist,
      });

      await tx
        .update(schema.job)
        .set({ status: JobStatus.Running, totalSteps: 1 })
        .where(eq(schema.job.id, input.jobId));
    });
  }

  async updateRunningCreatePlaylistPayload(
    input: Parameters<
      PlaylistActionJobRepository["updateRunningCreatePlaylistPayload"]
    >[0],
  ) {
    await this.db
      .update(schema.step)
      .set({ payload: input.payload })
      .where(
        and(
          eq(schema.step.id, input.stepId),
          eq(schema.step.status, StepStatus.Running),
        ),
      );
  }

  async createAddPlaylistItemStepsForCreatedPlaylist(
    input: Parameters<
      PlaylistActionJobRepository["createAddPlaylistItemStepsForCreatedPlaylist"]
    >[0],
  ) {
    await this.db.transaction(async (tx) => {
      await tx.insert(schema.step).values(input.steps.map(toAddStepRow));
      await tx
        .update(schema.step)
        .set({ payload: input.parentPayload })
        .where(
          and(
            eq(schema.step.id, input.parentStepId),
            eq(schema.step.status, StepStatus.Running),
          ),
        );
      await tx
        .update(schema.job)
        .set({
          totalSteps: sql`${schema.job.totalSteps} + ${input.steps.length}`,
        })
        .where(eq(schema.job.id, input.jobId));
    });
  }

  async findExecutionSteps(
    jobId: Parameters<PlaylistActionJobRepository["findExecutionSteps"]>[0],
  ) {
    return selectExecutionSteps(this.db, jobId);
  }

  async createPlannedAddPlaylistItemStepsAndStartJob(
    input: Parameters<
      PlaylistActionJobRepository["createPlannedAddPlaylistItemStepsAndStartJob"]
    >[0],
  ) {
    return this.db.transaction(async (tx) => {
      await lockJob(tx, input.jobId);

      const existing = await selectExecutionSteps(tx, input.jobId);
      if (existing.length > 0) return existing;

      for (
        let offset = 0;
        offset < input.steps.length;
        offset += STEP_INSERT_CHUNK_SIZE
      ) {
        await tx
          .insert(schema.step)
          .values(
            input.steps
              .slice(offset, offset + STEP_INSERT_CHUNK_SIZE)
              .map(toAddStepRow),
          );
      }

      await tx
        .update(schema.job)
        .set({ status: JobStatus.Running, totalSteps: input.steps.length })
        .where(
          and(
            eq(schema.job.id, input.jobId),
            inArray(schema.job.status, ACTIVE_JOB_STATUSES),
          ),
        );

      return input.steps.map((step): ExecutionStepRecord => ({
        id: step.id,
        status: StepStatus.Pending,
      }));
    });
  }

  async updateRunningAddPlaylistItemPayload(
    input: Parameters<
      PlaylistActionJobRepository["updateRunningAddPlaylistItemPayload"]
    >[0],
  ) {
    await this.db
      .update(schema.step)
      .set({ payload: input.payload })
      .where(
        and(
          eq(schema.step.id, input.stepId),
          eq(schema.step.status, StepStatus.Running),
        ),
      );
  }

  async findSanitizedJobProgressSummary(
    jobId: Parameters<
      PlaylistActionJobRepository["findSanitizedJobProgressSummary"]
    >[0],
  ) {
    const [row] = await this.db
      .select({
        completeSteps: schema.job.completeSteps,
        dismissed: schema.job.dismissed,
        id: schema.job.id,
        status: schema.job.status,
        totalSteps: schema.job.totalSteps,
        type: schema.job.type,
        userId: schema.job.userId,
      })
      .from(schema.job)
      .where(eq(schema.job.id, jobId));

    if (!row || row.dismissed) return { type: "not_found" as const };

    try {
      return {
        type: "found" as const,
        job: parseBackendJob(row),
        userId: toUserId(row.userId),
      };
    } catch (error) {
      Sentry.captureException(error, {
        extra: { jobId },
        tags: { "job.progress": "invalid_summary" },
      });
      return { type: "invalid" as const, error };
    }
  }

  async findSanitizedJobProgressSummariesForUser(
    userId: Parameters<
      PlaylistActionJobRepository["findSanitizedJobProgressSummariesForUser"]
    >[0],
  ) {
    const rows = await this.db
      .select({
        completeSteps: schema.job.completeSteps,
        id: schema.job.id,
        status: schema.job.status,
        totalSteps: schema.job.totalSteps,
        type: schema.job.type,
      })
      .from(schema.job)
      .where(
        and(eq(schema.job.userId, userId), eq(schema.job.dismissed, false)),
      );

    return rows.flatMap((row) => {
      try {
        return [parseBackendJob(row)];
      } catch (error) {
        Sentry.captureException(error, {
          extra: { jobId: row.id, userId },
          tags: { "job.progress": "invalid_snapshot_summary" },
        });
        return [];
      }
    });
  }

  async findJobStatusesForUser(
    input: Parameters<PlaylistActionJobRepository["findJobStatusesForUser"]>[0],
  ) {
    if (input.jobIds.length === 0) return [];

    const rows = await this.db
      .select({
        id: schema.job.id,
        status: schema.job.status,
      })
      .from(schema.job)
      .where(
        and(
          eq(schema.job.userId, input.userId),
          inArray(schema.job.id, input.jobIds),
        ),
      );

    return rows.map((row) => ({
      id: toJobId(row.id),
      status: row.status,
    }));
  }

  async dismissJobs(
    input: Parameters<PlaylistActionJobRepository["dismissJobs"]>[0],
  ) {
    if (input.jobIds.length === 0) return [];

    const rows = await this.db
      .update(schema.job)
      .set({ dismissed: true })
      .where(
        and(
          eq(schema.job.userId, input.userId),
          inArray(schema.job.id, input.jobIds),
        ),
      )
      .returning({ id: schema.job.id });

    return rows.map((row) => toJobId(row.id));
  }
}

/**
 * Takes the Job row lock. Every transaction that changes Step terminal state or
 * the Job's planned Steps locks the Job first, so settlement always observes
 * the other transactions' committed Step updates and two concurrent
 * completions cannot both miss being the last one.
 */
const lockJob = async (tx: Tx, jobId: string) => {
  await tx
    .select({ id: schema.job.id })
    .from(schema.job)
    .where(eq(schema.job.id, jobId))
    .for("update");
};

/**
 * Moves an active Job to its terminal status once no Step is Pending or
 * Running: `Failed` if any Step failed, otherwise `Completed`. A Job that is
 * already terminal is never changed, so a late completion cannot turn `Failed`
 * into `Completed`. Must run inside a transaction holding `lockJob`.
 */
const settleJob = async (tx: Tx, jobId: string) => {
  const counts = await tx
    .select({
      count: sql<number>`count(*)::int`,
      status: schema.step.status,
    })
    .from(schema.step)
    .where(eq(schema.step.jobId, jobId))
    .groupBy(schema.step.status);

  const countOf = (status: (typeof counts)[number]["status"]) =>
    counts.find((row) => row.status === status)?.count ?? 0;

  if (countOf(StepStatus.Pending) + countOf(StepStatus.Running) > 0) return;

  await tx
    .update(schema.job)
    .set({
      status:
        countOf(StepStatus.Failed) > 0 ? JobStatus.Failed : JobStatus.Completed,
    })
    .where(
      and(
        eq(schema.job.id, jobId),
        inArray(schema.job.status, ACTIVE_JOB_STATUSES),
      ),
    );
};

const selectExecutionSteps = async (
  db: Db | Tx,
  jobId: string,
): Promise<ExecutionStepRecord[]> => {
  const rows = await db
    .select({ id: schema.step.id, status: schema.step.status })
    .from(schema.step)
    .where(
      and(
        eq(schema.step.jobId, jobId),
        ne(schema.step.type, StepType.PlanSteps),
      ),
    );

  return rows.map((row) => ({ id: toStepId(row.id), status: row.status }));
};

const toAddStepRow = (step: AddPlaylistItemStepDraft) => ({
  attemptCount: 0,
  id: step.id,
  jobId: step.jobId,
  payload: {
    playlistId: step.playlistId,
    videoId: step.videoId,
  },
  status: StepStatus.Pending,
  type: StepType.AddPlaylistItem,
});

const toJobRecord = (
  job: typeof schema.job.$inferSelect,
): PlaylistActionJobRecord => ({
  accountId: toAccountId(job.accountId),
  completeSteps: job.completeSteps,
  createdAt: job.createdAt,
  error: job.error,
  id: toJobId(job.id),
  status: job.status,
  totalSteps: job.totalSteps,
  type: job.type,
  updatedAt: job.updatedAt,
  userId: toUserId(job.userId),
});

const toStepRecord = (
  step: typeof schema.step.$inferSelect,
): PlaylistActionStepRecord => ({
  attemptCount: step.attemptCount,
  createdAt: step.createdAt,
  failedAt: step.failedAt,
  id: toStepId(step.id),
  jobId: toJobId(step.jobId),
  lastError: step.lastError,
  payload: step.payload,
  status: step.status,
  type: step.type,
  updatedAt: step.updatedAt,
});
