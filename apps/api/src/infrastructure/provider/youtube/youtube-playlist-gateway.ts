import {
  toPlaylistId,
  toPlaylistItemId,
  toVideoId,
} from "@playlistwizard/core/ids";
import type { VideoId } from "@playlistwizard/core/ids";
import { formatError } from "../../../shared/format-error";
import type { PlaylistProviderGateway } from "../../../usecase/playlist-actions/ports";
import { NonRetryableError } from "../../../shared/non-retryable-error";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

// YouTube Data API v3 caps playlistItems.list pages at 50 items.
const PLAYLIST_ITEMS_PAGE_SIZE = "50";

/**
 * 403 reasons that describe a temporary or quota condition rather than a
 * permission problem. Quota exhaustion stays retryable so it goes through the
 * Queue's bounded retries and DLQ like other transient errors.
 * https://developers.google.com/youtube/v3/docs/errors
 */
const RETRYABLE_FORBIDDEN_REASONS = new Set([
  "quotaExceeded",
  "rateLimitExceeded",
  "userRateLimitExceeded",
]);

type YouTubeApiRequest = {
  accessToken: string;
  body?: unknown;
  errorContext: string;
  method?: string;
  params?: Record<string, string | undefined>;
  parts?: string[];
  path: string;
};

type YouTubePlaylistItemsPage = {
  items?: Array<{ contentDetails?: { videoId?: string } }>;
  nextPageToken?: string;
};

export class YouTubePlaylistGateway implements PlaylistProviderGateway {
  async createPlaylist(
    input: Parameters<PlaylistProviderGateway["createPlaylist"]>[0],
  ) {
    const playlist = await this.fetchJson<{ id: string }>({
      accessToken: input.accessToken,
      body: {
        snippet: { title: input.name },
        status: { privacyStatus: input.privacy },
      },
      errorContext: "YouTube playlist insert",
      method: "POST",
      parts: ["id", "snippet", "status"],
      path: "/playlists",
    });

    return { id: toPlaylistId(playlist.id) };
  }

  async listPlaylistVideoIds(
    input: Parameters<PlaylistProviderGateway["listPlaylistVideoIds"]>[0],
  ) {
    const videoIds: VideoId[] = [];
    let pageToken: string | undefined;

    do {
      const page = await this.fetchJson<YouTubePlaylistItemsPage>({
        accessToken: input.accessToken,
        errorContext: "YouTube playlist items list",
        params: {
          maxResults: PLAYLIST_ITEMS_PAGE_SIZE,
          pageToken,
          playlistId: input.playlistId,
        },
        parts: ["contentDetails"],
        path: "/playlistItems",
      });

      for (const item of page.items ?? []) {
        const videoId = item.contentDetails?.videoId;
        if (videoId) videoIds.push(toVideoId(videoId));
      }

      pageToken = page.nextPageToken;
    } while (pageToken);

    return videoIds;
  }

  async addPlaylistItem(
    input: Parameters<PlaylistProviderGateway["addPlaylistItem"]>[0],
  ) {
    const item = await this.fetchJson<{ id: string }>({
      accessToken: input.accessToken,
      body: {
        snippet: {
          playlistId: input.playlistId,
          resourceId: { kind: "youtube#video", videoId: input.videoId },
        },
      },
      errorContext: "YouTube playlist item insert",
      method: "POST",
      parts: ["id", "snippet"],
      path: "/playlistItems",
    });

    return { id: toPlaylistItemId(item.id) };
  }

  private async fetchJson<T>(request: YouTubeApiRequest): Promise<T> {
    let response: Response;
    try {
      response = await fetch(this.createUrl(request), {
        body:
          request.body === undefined ? undefined : JSON.stringify(request.body),
        headers: {
          Authorization: `Bearer ${request.accessToken}`,
          ...(request.body === undefined
            ? {}
            : { "Content-Type": "application/json" }),
        },
        method: request.method ?? "GET",
      });
    } catch (err) {
      throw new Error(
        `${request.errorContext} request failed: ${formatError(err)}`,
      );
    }

    if (!response.ok) {
      const text = await response.text();
      const message = `YouTube API error: ${response.status} ${text}`;
      throw isPermanentYouTubeError(response.status, text)
        ? new NonRetryableError(message)
        : new Error(message);
    }

    return (await response.json()) as T;
  }

  private createUrl(request: YouTubeApiRequest): string {
    const url = new URL(`${YOUTUBE_API_BASE_URL}${request.path}`);

    if (request.parts?.length) {
      url.searchParams.set("part", request.parts.join(","));
    }

    for (const [key, value] of Object.entries(request.params ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }
}

/**
 * Classifies YouTube errors that a retry cannot fix: invalid requests, missing
 * resources, and permission failures. Auth (401), conflict (409), throttling
 * (429), quota/rate-limit 403s, and server errors stay retryable.
 */
export const isPermanentYouTubeError = (
  status: number,
  body: string,
): boolean => {
  if (status === 400 || status === 404) return true;
  if (status !== 403) return false;

  const reasons = parseYouTubeErrorReasons(body);
  return !reasons.some((reason) => RETRYABLE_FORBIDDEN_REASONS.has(reason));
};

const parseYouTubeErrorReasons = (body: string): string[] => {
  try {
    const parsed = JSON.parse(body) as {
      error?: { errors?: Array<{ reason?: unknown }> };
    };
    return (parsed.error?.errors ?? []).flatMap((error) =>
      typeof error.reason === "string" ? [error.reason] : [],
    );
  } catch {
    return [];
  }
};
