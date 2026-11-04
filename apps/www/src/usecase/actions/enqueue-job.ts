import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
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

/**
 * Converts a `POST /v1/jobs` response into an enqueue result. A success only
 * means the Job was accepted; its progress arrives through JobProgressProvider.
 */
const toEnqueueJobResult = async (
  response: Response,
): Promise<EnqueueJobResult> => {
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
};

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

    return await toEnqueueJobResult(response);
  } catch (error) {
    return { success: false, status: 500, error: formatError(error) };
  }
};

/**
 * Requests one Sync Job for the whole Definition on the given Account. The
 * Definition sent here is the snapshot the Job executes, regardless of later
 * edits or Account switches.
 */
export const enqueueSyncJob = async ({
  accountId,
  definition,
}: {
  accountId: AccountId;
  definition: StructuredPlaylistsDefinition;
}): Promise<EnqueueJobResult> => {
  try {
    const client = createApiClient(requirePublicApiOrigin());
    const response = await client.jobs.$post(
      {
        json: {
          type: JobType.Sync,
          accountId,
          definition,
        },
      },
      {
        init: { credentials: "include" },
      },
    );

    return await toEnqueueJobResult(response);
  } catch (error) {
    return { success: false, status: 500, error: formatError(error) };
  }
};
