"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { job } from "@/lib/db/schema";
import { getSession } from "@/repository/auth/session";

export async function dismissBackendJobs(jobIds: string[]): Promise<void> {
  if (jobIds.length === 0) return;

  const session = await getSession();
  if (!session) return;

  await db
    .update(job)
    .set({ dismissed: true })
    .where(and(eq(job.userId, session.user.id), inArray(job.id, jobIds)));
}
