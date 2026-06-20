import { dismissJobsResponseSchema } from "@playlistwizard/playlist-action-job";
import { createApiClient } from "@playlistwizard/playlist-action-job-client";
import * as v from "valibot";
import { requirePublicApiOrigin } from "@/lib/api-url";

export type DismissBackendJobsResult =
  | { success: true; jobIds: string[] }
  | { success: false; status: number };

export async function dismissBackendJobs(
  jobIds: string[],
): Promise<DismissBackendJobsResult> {
  if (jobIds.length === 0) return { success: true, jobIds: [] };

  const client = createApiClient(requirePublicApiOrigin());
  const response = await client.jobs.dismiss.$post(
    {
      json: { jobIds },
    },
    {
      init: { credentials: "include" },
    },
  );

  if (!response.ok) return { success: false, status: response.status };

  const parsed = v.safeParse(dismissJobsResponseSchema, await response.json());
  if (!parsed.success) return { success: false, status: 502 };

  return { success: true, jobIds: parsed.output.jobIds };
}
