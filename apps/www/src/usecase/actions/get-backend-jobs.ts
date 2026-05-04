"use server";

import { JobStatus, type JobType } from "@playlistwizard/playlist-action-job";
import { and, eq, gte, inArray, or } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { job } from "@/lib/db/schema";

const DISPLAY_RETENTION_MS = 30 * 1000;

export type BackendJob = {
  id: string;
  type: JobType;
  status: JobStatus;
  completeSteps: number;
  totalSteps: number;
};

export async function getBackendJobs(): Promise<BackendJob[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const userId = session.user.id;
  const retentionThreshold = new Date(Date.now() - DISPLAY_RETENTION_MS);

  return db
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
        or(
          inArray(job.status, [JobStatus.Pending, JobStatus.Running]),
          and(
            inArray(job.status, [JobStatus.Completed, JobStatus.Failed]),
            gte(job.updatedAt, retentionThreshold),
          ),
        ),
      ),
    );
}
