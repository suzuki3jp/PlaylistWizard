"use server";

import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { job } from "@/lib/db/schema";

export async function dismissBackendJobs(jobIds: string[]): Promise<void> {
  if (jobIds.length === 0) return;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  await db
    .update(job)
    .set({ dismissed: true })
    .where(and(eq(job.userId, session.user.id), inArray(job.id, jobIds)));
}
