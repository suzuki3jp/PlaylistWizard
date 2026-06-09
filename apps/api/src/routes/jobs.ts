import { vValidator } from "@hono/valibot-validator";
import * as schema from "@playlistwizard/db";
import type { PlanStepsCreatePayload } from "@playlistwizard/playlist-action-job";
import {
  createJobRequestSchema,
  JobStatus,
  JobType,
  StepStatus,
  StepType,
  toJobId,
  toStepId,
} from "@playlistwizard/playlist-action-job";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { findOwnedAccount } from "../accounts";
import type { AuthSession, WorkerAuth } from "../auth";
import type { Db } from "../db";
import type { Env, QueueLike } from "../env";

type Variables = {
  db: Db;
  auth: WorkerAuth;
  session: AuthSession;
};

const generateId = () => crypto.randomUUID();

const formatError = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

export const jobsRoute = new Hono<{
  Bindings: Env & { PLAYLIST_ACTION_JOB_QUEUE: QueueLike };
  Variables: Variables;
}>().post(
  "/create",
  vValidator("json", createJobRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid request", details: result.issues }, 400);
    }
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    const userId = session.user.id;

    const { accountId, payload } = c.req.valid("json");

    // Verify account ownership
    const accountRecord = await findOwnedAccount({
      accountId,
      db,
      userId,
    });
    if (!accountRecord) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const jobId = toJobId(generateId());
    const planStepId = toStepId(generateId());

    const planStepsPayload: PlanStepsCreatePayload = {
      newPlaylistName: payload.newPlaylistName,
      privacy: payload.privacy,
    };

    // Insert job and PlanSteps step in a transaction
    await db.transaction(async (tx) => {
      await tx.insert(schema.job).values({
        id: jobId,
        type: JobType.Create,
        status: JobStatus.Pending,
        completeSteps: 0,
        totalSteps: 0,
        userId,
        accountId,
      });

      await tx.insert(schema.step).values({
        id: planStepId,
        jobId,
        type: StepType.PlanSteps,
        status: StepStatus.Pending,
        attemptCount: 0,
        payload: planStepsPayload,
      });
    });

    try {
      await c.env.PLAYLIST_ACTION_JOB_QUEUE.send({ stepId: planStepId });
    } catch (err) {
      const errorMessage = `Failed to enqueue job: ${formatError(err)}`;
      const now = new Date();

      await db.transaction(async (tx) => {
        await tx
          .update(schema.step)
          .set({
            status: StepStatus.Failed,
            lastError: errorMessage,
            failedAt: now,
          })
          .where(eq(schema.step.id, planStepId));

        await tx
          .update(schema.job)
          .set({
            status: JobStatus.Failed,
            error: { message: errorMessage },
          })
          .where(eq(schema.job.id, jobId));
      });

      return c.json({ error: "Failed to enqueue job" }, 500);
    }

    return c.json({ jobId }, 201);
  },
);
