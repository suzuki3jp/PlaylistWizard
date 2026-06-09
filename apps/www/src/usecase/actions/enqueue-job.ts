import type { PlaylistPrivacy } from "@playlistwizard/playlist-action-job";
import { createJobResponseSchema } from "@playlistwizard/playlist-action-job";
import { createWorkersClient } from "@playlistwizard/playlist-action-job-client";
import * as v from "valibot";
import type { AccountId } from "@/entities/ids";

const getWorkersUrl = (): string => {
  const url =
    process.env.NEXT_PUBLIC_WORKERS_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  if (!url) throw new Error("NEXT_PUBLIC_WORKERS_URL is not set");
  return url;
};

const formatError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
};

const errorResponseSchema = v.object({
  error: v.optional(v.string()),
});

const getResponseErrorMessage = (body: unknown): string => {
  const parsed = v.safeParse(errorResponseSchema, body);
  return parsed.success
    ? (parsed.output.error ?? "Unknown error")
    : "Unknown error";
};

export type EnqueueJobResult =
  | { success: true; jobId: string }
  | { success: false; status: number; error: string };

export const enqueueCreateJob = async ({
  accountId,
  newPlaylistName,
  privacy,
}: {
  accountId: AccountId;
  newPlaylistName: string;
  privacy: PlaylistPrivacy;
}): Promise<EnqueueJobResult> => {
  try {
    const client = createWorkersClient(getWorkersUrl());
    const response = await client.jobs.create.$post(
      {
        json: {
          accountId,
          payload: { newPlaylistName, privacy },
        },
      },
      {
        init: { credentials: "include" },
      },
    );

    if (!response.ok) {
      const body = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      return {
        success: false,
        status: response.status,
        error: getResponseErrorMessage(body),
      };
    }

    const data = v.safeParse(createJobResponseSchema, await response.json());
    if (!data.success) {
      return {
        success: false,
        status: 502,
        error: "Invalid Workers response",
      };
    }

    return { success: true, jobId: data.output.jobId };
  } catch (error) {
    return { success: false, status: 500, error: formatError(error) };
  }
};
