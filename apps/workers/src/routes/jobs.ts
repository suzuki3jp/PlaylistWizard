import * as schema from "@playlistwizard/db";
import type { PlanStepsCreatePayload } from "@playlistwizard/playlist-action-job";
import {
  JobStatus,
  JobType,
  StepStatus,
  StepType,
  toJobId,
  toStepId,
} from "@playlistwizard/playlist-action-job";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { WorkerAuth } from "../auth";
import { extractSessionToken, verifySession } from "../auth";
import type { Db } from "../db";
import type { Env, QueueLike } from "../env";

type Variables = {
  db: Db;
  auth: WorkerAuth;
};

const createJobSchema = z.object({
  accountId: z.string(),
  payload: z.object({
    newPlaylistName: z.string().min(1),
  }),
});

const generateId = () => crypto.randomUUID();

export const jobsRoute = new Hono<{
  Bindings: Env & { PLAYLIST_ACTION_JOB_QUEUE: QueueLike };
  Variables: Variables;
}>().post("/create", async (c) => {
  const db = c.get("db");
  const auth = c.get("auth");

  const sessionToken = extractSessionToken(
    c.req.header("Authorization") ?? null,
  );
  if (!sessionToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const session = await verifySession(auth, sessionToken);
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = session.user.id;

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid request", details: parsed.error.issues },
      400,
    );
  }

  const { accountId, payload } = parsed.data;

  // Verify account ownership
  const accountRecord = await db.query.account.findFirst({
    where: and(
      eq(schema.account.id, accountId),
      eq(schema.account.userId, userId),
    ),
  });
  if (!accountRecord) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const jobId = toJobId(generateId());
  const planStepId = toStepId(generateId());

  const planStepsPayload: PlanStepsCreatePayload = {
    newPlaylistName: payload.newPlaylistName,
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

  // Enqueue the PlanSteps step
  await c.env.PLAYLIST_ACTION_JOB_QUEUE.send({ stepId: planStepId });

  return c.json({ jobId }, 201);
});
