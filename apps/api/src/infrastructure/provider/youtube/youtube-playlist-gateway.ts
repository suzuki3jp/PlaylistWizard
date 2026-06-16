import { formatError } from "../../../shared/format-error";
import type { PlaylistProviderGateway } from "../../../usecase/playlist-actions/ports";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

type YouTubeApiRequest = {
  accessToken: string;
  body?: unknown;
  errorContext: string;
  method?: string;
  params?: Record<string, string | undefined>;
  parts?: string[];
  path: string;
};

export class YouTubePlaylistGateway implements PlaylistProviderGateway {
  async createPlaylist(
    input: Parameters<PlaylistProviderGateway["createPlaylist"]>[0],
  ) {
    return this.fetchJson<{ id: string }>({
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
      throw new Error(`YouTube API error: ${response.status} ${text}`);
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
