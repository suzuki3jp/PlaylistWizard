import { toAccountId, toUserId } from "@playlistwizard/core/ids";
import * as schema from "@playlistwizard/db";
import {
  JobStatus,
  JobType,
  parseBackendJob,
  StepStatus,
  StepType,
  toJobId,
  toStepId,
} from "@playlistwizard/playlist-action-job";
import * as Sentry from "@sentry/cloudflare";
import { and, eq, inArray, lt, or, sql } from "drizzle-orm";
import type {
  AddPlaylistItemStepDraft,
  PlaylistActionJobRecord,
  PlaylistActionJobRepository,
  PlaylistActionStepRecord,
} from "../../usecase/playlist-actions/ports";
import type { Db } from "../db/connection";

export class DrizzlePlaylistActionJobRepository
  implements PlaylistActionJobRepository
{
  constructor(private readonly db: Db) {}

  async createCreatePlaylistJob(
    input: Parameters<
      PlaylistActionJobRepository["createCreatePlaylistJob"]
    >[0],
  ) {
    await this.db.transaction(async (tx) => {
      await tx.insert(schema.job).values({
        accountId: input.accountId,
        completeSteps: 0,
        id: input.jobId,
        status: JobStatus.Pending,
        totalSteps: 0,
        type: JobType.Create,
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

  async markCreatePlaylistJobEnqueueFailed(
    input: Parameters<
      PlaylistActionJobRepository["markCreatePlaylistJobEnqueueFailed"]
    >[0],
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
    const [updated] = await this.db
      .update(schema.step)
      .set({ status: StepStatus.Completed })
      .where(
        and(
          eq(schema.step.id, input.stepId),
          eq(schema.step.status, StepStatus.Running),
        ),
      )
      .returning();

    if (!updated) return;
    if (updated.type === StepType.PlanSteps) return;

    const [jobRow] = await this.db
      .update(schema.job)
      .set({ completeSteps: sql`${schema.job.completeSteps} + 1` })
      .where(eq(schema.job.id, input.jobId))
      .returning();

    if (
      jobRow &&
      jobRow.totalSteps > 0 &&
      jobRow.completeSteps >= jobRow.totalSteps
    ) {
      await this.db
        .update(schema.job)
        .set({ status: JobStatus.Completed })
        .where(eq(schema.job.id, input.jobId));
    }
  }

  async failStep(
    input: Parameters<PlaylistActionJobRepository["failStep"]>[0],
  ) {
    const now = new Date();

    await this.db
      .update(schema.step)
      .set({
        failedAt: now,
        lastError: input.errorMessage,
        status: StepStatus.Failed,
      })
      .where(eq(schema.step.id, input.stepId));

    await this.db
      .update(schema.job)
      .set({
        error: { message: input.errorMessage },
        status: JobStatus.Failed,
      })
      .where(eq(schema.job.id, input.jobId));
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
