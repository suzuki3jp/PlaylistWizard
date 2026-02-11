import { err, ok, type Result } from "neverthrow";
import type { ZodType } from "zod";

import type {
  FullPlaylist,
  Playlist,
  PlaylistItem,
  PlaylistPrivacy,
} from "@/features/playlist/entities";
import type { Repository } from "..";
import { YouTubeRepositoryError } from "./errors";
import {
  createListResponse,
  type ListResponse,
  PlaylistItemResource,
  PlaylistResource,
} from "./schemas";
import { transformPlaylist, transformPlaylistItem } from "./transformers";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export class YouTubeRepository implements Repository {
  private readonly playlistParts = ["id", "snippet", "contentDetails"];
  private readonly playlistItemParts = ["id", "snippet", "contentDetails"];

  constructor(private accessToken: string) {}

  async getMyPlaylists(): Promise<Result<Playlist[], YouTubeRepositoryError>> {
    const schema = createListResponse(PlaylistResource);

    const result = await this.fetchAllPages<typeof PlaylistResource>(
      "/playlists",
      schema,
      {
        part: this.playlistParts.join(","),
        mine: "true",
        maxResults: "50",
      },
    );

    if (result.isErr()) {
      return err(result.error);
    }

    return ok(result.value.map(transformPlaylist));
  }

  async getFullPlaylist(
    playlistId: string,
  ): Promise<Result<FullPlaylist, YouTubeRepositoryError>> {
    const playlistSchema = createListResponse(PlaylistResource);
    const playlistResult = await this.fetch("/playlists", playlistSchema, {
      part: this.playlistParts.join(","),
      id: playlistId,
    });

    if (playlistResult.isErr()) {
      return err(playlistResult.error);
    }

    const playlistData = playlistResult.value.items[0];
    if (!playlistData) {
      return err(YouTubeRepositoryError.fromHttpStatus(404));
    }

    const itemsSchema = createListResponse(PlaylistItemResource);
    const itemsResult = await this.fetchAllPages<typeof PlaylistItemResource>(
      "/playlistItems",
      itemsSchema,
      {
        part: this.playlistItemParts.join(","),
        playlistId,
        maxResults: "50",
      },
    );

    if (itemsResult.isErr()) {
      return err(itemsResult.error);
    }

    const playlist = transformPlaylist(playlistData);
    const items = itemsResult.value.map(transformPlaylistItem);

    return ok({
      ...playlist,
      items,
    });
  }

  async addPlaylist(
    title: string,
    privacy: PlaylistPrivacy,
  ): Promise<Result<Playlist, YouTubeRepositoryError>> {
    const result = await this.fetch(
      "/playlists",
      PlaylistResource,
      {
        part: this.playlistParts.join(","),
      },
      {
        method: "POST",
        body: JSON.stringify({
          snippet: { title },
          status: { privacyStatus: privacy },
        }),
      },
    );

    if (result.isErr()) {
      return err(result.error);
    }

    return ok(transformPlaylist(result.value));
  }

  async addPlaylistItem(
    playlistId: string,
    resourceId: string,
  ): Promise<Result<PlaylistItem, YouTubeRepositoryError>> {
    const result = await this.fetch(
      "/playlistItems",
      PlaylistItemResource,
      {
        part: this.playlistItemParts.join(","),
      },
      {
        method: "POST",
        body: JSON.stringify({
          snippet: {
            playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId: resourceId,
            },
          },
        }),
      },
    );

    if (result.isErr()) {
      return err(result.error);
    }

    return ok(transformPlaylistItem(result.value));
  }

  async removePlaylistItem(
    itemId: string,
    _playlistId: string,
  ): Promise<Result<void, YouTubeRepositoryError>> {
    const response = await this.rawFetch(
      "/playlistItems",
      { id: itemId },
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      return err(YouTubeRepositoryError.fromHttpStatus(response.status));
    }

    return ok(undefined);
  }

  async updatePlaylistItemPosition(
    itemId: string,
    playlistId: string,
    resourceId: string,
    position: number,
  ): Promise<Result<PlaylistItem, YouTubeRepositoryError>> {
    const result = await this.fetch(
      "/playlistItems",
      PlaylistItemResource,
      {
        part: "snippet",
      },
      {
        method: "PUT",
        body: JSON.stringify({
          id: itemId,
          snippet: {
            playlistId,
            position,
            resourceId: {
              kind: "youtube#video",
              videoId: resourceId,
            },
          },
        }),
      },
    );

    if (result.isErr()) {
      return err(result.error);
    }

    return ok(transformPlaylistItem(result.value));
  }

  async deletePlaylist(
    playlistId: string,
  ): Promise<Result<Playlist, YouTubeRepositoryError>> {
    const playlistSchema = createListResponse(PlaylistResource);
    const playlistResult = await this.fetch("/playlists", playlistSchema, {
      part: this.playlistParts.join(","),
      id: playlistId,
    });

    if (playlistResult.isErr()) {
      return err(playlistResult.error);
    }

    const playlistData = playlistResult.value.items[0];
    if (!playlistData) {
      return err(YouTubeRepositoryError.fromHttpStatus(404));
    }

    const response = await this.rawFetch(
      "/playlists",
      { id: playlistId },
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      return err(YouTubeRepositoryError.fromHttpStatus(response.status));
    }

    return ok(transformPlaylist(playlistData));
  }

  private async fetch<T extends ZodType>(
    path: string,
    schema: T,
    params: Record<string, string>,
    options: RequestInit = {},
  ): Promise<Result<T["_output"], YouTubeRepositoryError>> {
    const response = await this.rawFetch(path, params, options);

    if (!response.ok) {
      return err(YouTubeRepositoryError.fromHttpStatus(response.status));
    }

    const json = await response.json();
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return err(YouTubeRepositoryError.validationError(parsed.error.message));
    }

    return ok(parsed.data);
  }

  private async fetchAllPages<T extends ZodType>(
    path: string,
    schema: ZodType<ListResponse<T["_output"]>>,
    params: Record<string, string>,
  ): Promise<Result<T["_output"][], YouTubeRepositoryError>> {
    const allItems: T["_output"][] = [];
    let pageToken: string | undefined;

    do {
      const currentParams = pageToken ? { ...params, pageToken } : params;

      const result = await this.fetch(path, schema, currentParams);

      if (result.isErr()) {
        return err(result.error);
      }

      allItems.push(...result.value.items);
      pageToken = result.value.nextPageToken;
    } while (pageToken);

    return ok(allItems);
  }

  private async rawFetch(
    path: string,
    params: Record<string, string>,
    options: RequestInit = {},
  ): Promise<Response> {
    const url = this.makeUrl(path, params);
    const headers: HeadersInit = {
      Authorization: `Bearer ${this.accessToken}`,
    };

    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
  }

  private makeUrl(path: string, params?: Record<string, string>): string {
    const searchParams = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return `${YOUTUBE_API_BASE}${path}${searchParams}`;
  }
}
