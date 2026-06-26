import type { PlaylistPrivacy } from "@playlistwizard/playlist-action-job";
import {
  createJobResponseSchema,
  JobType,
} from "@playlistwizard/playlist-action-job";
import { createApiClient } from "@playlistwizard/playlist-action-job-client";
import * as v from "valibot";
import type { AccountId } from "@/entities/ids";
import { requirePublicApiOrigin } from "@/lib/api-url";

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
    const client = createApiClient(requirePublicApiOrigin());
    const response = await client.jobs.$post(
      {
        json: {
          type: JobType.Create,
          accountId,
          playlistName: newPlaylistName,
          privacy,
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
        error: "Invalid API response",
      };
    }

    return { success: true, jobId: data.output.jobId };
  } catch (error) {
    return { success: false, status: 500, error: formatError(error) };
  }
};
