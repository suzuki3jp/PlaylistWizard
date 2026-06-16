import { dismissJobsResponseSchema } from "@playlistwizard/playlist-action-job";
import { createApiClient } from "@playlistwizard/playlist-action-job-client";
import * as v from "valibot";

const getApiUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not set");
  return url;
};

export type DismissBackendJobsResult =
  | { success: true; jobIds: string[] }
  | { success: false; status: number };

export async function dismissBackendJobs(
  jobIds: string[],
): Promise<DismissBackendJobsResult> {
  if (jobIds.length === 0) return { success: true, jobIds: [] };

  const client = createApiClient(getApiUrl());
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
