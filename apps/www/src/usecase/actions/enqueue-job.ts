"use server";

import type { PlaylistPrivacy } from "@playlistwizard/playlist-action-job";
import { createJobResponseSchema } from "@playlistwizard/playlist-action-job";
import { createWorkersClient } from "@playlistwizard/playlist-action-job-client";
import { cookies } from "next/headers";
import * as v from "valibot";
import type { AccountId } from "@/entities/ids";

const getWorkersUrl = (): string => {
  const url = process.env.WORKERS_URL;
  if (!url) throw new Error("WORKERS_URL is not set");
  return url;
};

const getSessionToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  // Support both secure and non-secure cookie name variants
  const secureToken = cookieStore.get("__Secure-better-auth.session_token");
  if (secureToken) return secureToken.value;
  const token = cookieStore.get("better-auth.session_token");
  return token?.value ?? null;
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
  const sessionToken = await getSessionToken();
  if (!sessionToken)
    return { success: false, status: 401, error: "Unauthorized" };

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
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
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
