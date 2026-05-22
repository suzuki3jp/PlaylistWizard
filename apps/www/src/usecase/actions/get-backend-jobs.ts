"use server";

import {
  type BackendJob,
  backendJobSchema,
  JobStatus,
} from "@playlistwizard/playlist-action-job";
import { and, eq, gte, inArray, or } from "drizzle-orm";
import { safeParse } from "valibot";
import { db } from "@/lib/db";
import { job } from "@/lib/db/schema";
import { getSession } from "@/repository/auth/session";

const DISPLAY_RETENTION_MS = 10 * 1000;

export async function getBackendJobs(): Promise<BackendJob[]> {
  const session = await getSession();
  if (!session) return [];

  const userId = session.user.id;
  const retentionThreshold = new Date(Date.now() - DISPLAY_RETENTION_MS);

  const rows = await db
    .select({
      id: job.id,
      type: job.type,
      status: job.status,
      completeSteps: job.completeSteps,
      totalSteps: job.totalSteps,
    })
    .from(job)
    .where(
      and(
        eq(job.userId, userId),
        eq(job.dismissed, false),
        or(
          inArray(job.status, [JobStatus.Pending, JobStatus.Running]),
          and(
            inArray(job.status, [JobStatus.Completed, JobStatus.Failed]),
            gte(job.updatedAt, retentionThreshold),
          ),
        ),
      ),
    );

  return rows.flatMap((row) => {
    const parsed = safeParse(backendJobSchema, row);
    return parsed.success ? [parsed.output] : [];
  });
}
