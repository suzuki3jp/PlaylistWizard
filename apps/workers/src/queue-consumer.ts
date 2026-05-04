import * as schema from "@playlistwizard/db";
import type {
  CreatePlaylistStepPayload,
  PlanStepsCreatePayload,
  StepQueueMessage,
} from "@playlistwizard/playlist-action-job";
import {
  JobStatus,
  StepStatus,
  StepType,
  toStepId,
} from "@playlistwizard/playlist-action-job";
import { and, eq, sql } from "drizzle-orm";
import type { WorkerAuth } from "./auth";
import type { Db } from "./db";
import type { QueueLike } from "./env";

const generateId = () => crypto.randomUUID();

const claimStep = async (db: Db, stepId: string) => {
  const [step] = await db
    .update(schema.step)
    .set({
      status: StepStatus.Running,
      attemptCount: sql`${schema.step.attemptCount} + 1`,
    })
    .where(
      and(
        eq(schema.step.id, stepId),
        eq(schema.step.status, StepStatus.Pending),
      ),
    )
    .returning();

  return step ?? null;
};

const completeStep = async (db: Db, stepId: string, jobId: string) => {
  const [updated] = await db
    .update(schema.step)
    .set({ status: StepStatus.Completed })
    .where(
      and(
        eq(schema.step.id, stepId),
        eq(schema.step.status, StepStatus.Running),
      ),
    )
    .returning();

  if (!updated) return;

  if (updated.type === StepType.PlanSteps) return;

  // Increment completeSteps and check if job is done
  const [jobRow] = await db
    .update(schema.job)
    .set({ completeSteps: sql`${schema.job.completeSteps} + 1` })
    .where(eq(schema.job.id, jobId))
    .returning();

  if (
    jobRow &&
    jobRow.totalSteps > 0 &&
    jobRow.completeSteps >= jobRow.totalSteps
  ) {
    await db
      .update(schema.job)
      .set({ status: JobStatus.Completed })
      .where(eq(schema.job.id, jobId));
  }
};

const failStep = async (
  db: Db,
  stepId: string,
  jobId: string,
  errorMessage: string,
) => {
  const now = new Date();
  await db
    .update(schema.step)
    .set({
      status: StepStatus.Failed,
      lastError: errorMessage,
      failedAt: now,
    })
    .where(eq(schema.step.id, stepId));

  await db
    .update(schema.job)
    .set({ status: JobStatus.Failed, error: { message: errorMessage } })
    .where(eq(schema.job.id, jobId));
};

const formatError = (err: unknown): string => {
  if (err instanceof Error) {
    const details = err as Error & {
      body?: unknown;
      status?: unknown;
      statusCode?: unknown;
    };
    const parts = [
      err.message || err.name,
      details.status ? `status=${String(details.status)}` : null,
      details.statusCode ? `statusCode=${String(details.statusCode)}` : null,
      details.body ? `body=${JSON.stringify(details.body)}` : null,
      err.stack && !err.message ? `stack=${err.stack}` : null,
    ].filter(Boolean);

    return parts.join(" ");
  }

  if (typeof err === "string") return err || "(empty string error)";

  if (err === null) return "(null error)";
  if (err === undefined) return "(undefined error)";

  try {
    const serialized = JSON.stringify(err);
    return serialized && serialized !== "{}"
      ? serialized
      : String(err) || "(empty object error)";
  } catch {
    return String(err) || "(unserializable error)";
  }
};

const resetStepToPendingWithError = async (
  db: Db,
  stepId: string,
  errorMessage: string,
) => {
  await db
    .update(schema.step)
    .set({
      status: StepStatus.Pending,
      lastError: errorMessage,
    })
    .where(
      and(
        eq(schema.step.id, stepId),
        eq(schema.step.status, StepStatus.Running),
      ),
    );
};

const executePlanStepsCreate = async (
  db: Db,
  queue: QueueLike,
  step: typeof schema.step.$inferSelect,
) => {
  const payload = step.payload as PlanStepsCreatePayload;
  const job = await db.query.job.findFirst({
    where: eq(schema.job.id, step.jobId),
  });

  if (!job) throw new Error(`Job not found: ${step.jobId}`);

  const createPlaylistStepId = toStepId(generateId());
  const createPayload: CreatePlaylistStepPayload = {
    name: payload.newPlaylistName,
  };

  await db.transaction(async (tx) => {
    await tx.insert(schema.step).values({
      id: createPlaylistStepId,
      jobId: step.jobId,
      type: StepType.CreatePlaylist,
      status: StepStatus.Pending,
      attemptCount: 0,
      payload: createPayload,
    });

    // Set totalSteps to 1 (just the CreatePlaylist step) and update job to Running
    await tx
      .update(schema.job)
      .set({ totalSteps: 1, status: JobStatus.Running })
      .where(eq(schema.job.id, step.jobId));
  });

  await queue.send({ stepId: createPlaylistStepId });
};

const executeCreatePlaylist = async (
  db: Db,
  queue: QueueLike,
  auth: WorkerAuth,
  step: typeof schema.step.$inferSelect,
) => {
  const payload = step.payload as CreatePlaylistStepPayload;
  const job = await db.query.job.findFirst({
    where: eq(schema.job.id, step.jobId),
  });

  if (!job) throw new Error(`Job not found: ${step.jobId}`);

  const account = await db.query.account.findFirst({
    where: and(
      eq(schema.account.id, job.accountId),
      eq(schema.account.userId, job.userId),
    ),
  });

  if (!account) throw new Error(`Account not found: ${job.accountId}`);

  // Get access token via Worker-side BetterAuth
  let tokenResult: Awaited<ReturnType<WorkerAuth["api"]["getAccessToken"]>>;
  try {
    tokenResult = await auth.api.getAccessToken({
      body: {
        providerId: account.providerId,
        accountId: account.accountId,
        userId: job.userId,
      },
    });
  } catch (err) {
    throw new Error(`getAccessToken failed: ${formatError(err)}`);
  }

  if (!tokenResult?.accessToken) {
    throw new Error(
      `getAccessToken returned no accessToken for provider=${account.providerId}`,
    );
  }

  const accessToken = tokenResult.accessToken;

  // Call YouTube Data API to create the playlist
  let response: Response;
  try {
    response = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: { title: payload.name },
        }),
      },
    );
  } catch (err) {
    throw new Error(
      `YouTube playlist insert request failed: ${formatError(err)}`,
    );
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube API error: ${response.status} ${text}`);
  }

  const created = (await response.json()) as { id: string };
  const createdPlaylistId = created.id;

  // Handle afterCreate: enqueue AddPlaylistItem steps if present
  if (payload.afterCreate?.enqueue?.length) {
    const addSteps: Array<{
      id: string;
      jobId: string;
      type: "AddPlaylistItem";
      status: "Pending";
      attemptCount: number;
      payload: { playlistId: string; videoId: string };
    }> = payload.afterCreate.enqueue.map((item) => ({
      id: toStepId(generateId()),
      jobId: step.jobId,
      type: "AddPlaylistItem" as const,
      status: "Pending" as const,
      attemptCount: 0,
      payload: { playlistId: createdPlaylistId, videoId: item.payload.videoId },
    }));

    await db.transaction(async (tx) => {
      await tx.insert(schema.step).values(addSteps);
      await tx
        .update(schema.job)
        .set({ totalSteps: sql`${schema.job.totalSteps} + ${addSteps.length}` })
        .where(eq(schema.job.id, step.jobId));
    });

    for (const addStep of addSteps) {
      await queue.send({ stepId: addStep.id });
    }
  }
};

export const processMessage = async (
  db: Db,
  queue: QueueLike,
  auth: WorkerAuth,
  message: StepQueueMessage,
): Promise<void> => {
  const { stepId } = message;

  const step = await claimStep(db, stepId);
  if (!step) return; // already claimed or completed

  try {
    if (step.type === StepType.PlanSteps) {
      const job = await db.query.job.findFirst({
        where: eq(schema.job.id, step.jobId),
      });
      if (!job) throw new Error(`Job not found: ${step.jobId}`);

      if (job.type === "Create") {
        await executePlanStepsCreate(db, queue, step);
      } else {
        throw new Error(`Unsupported job type for PlanSteps: ${job.type}`);
      }
    } else if (step.type === StepType.CreatePlaylist) {
      await executeCreatePlaylist(db, queue, auth, step);
    } else {
      throw new Error(`Unsupported step type: ${step.type}`);
    }

    await completeStep(db, stepId, step.jobId);
  } catch (err) {
    await resetStepToPendingWithError(db, stepId, formatError(err));
    throw err;
  }
};

export const processDlqMessage = async (
  db: Db,
  message: StepQueueMessage,
): Promise<void> => {
  const { stepId } = message;

  const stepRow = await db.query.step.findFirst({
    where: eq(schema.step.id, stepId),
  });

  if (!stepRow) return;

  const errorMessage = stepRow.lastError
    ? `Max retries exceeded: ${stepRow.lastError}`
    : "Max retries exceeded";

  await failStep(db, stepId, stepRow.jobId, errorMessage);
};
