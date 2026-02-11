import { err, ok, type Result } from "neverthrow";
import type { ZodType } from "zod";

import type {
  FullPlaylist,
  Playlist,
  PlaylistItem,
  PlaylistPrivacy,
} from "@/features/playlist/entities";
import type { Repository } from "..";
import { SpotifyRepositoryError } from "./errors";
import {
  createPaginatedResponse,
  type PaginatedResponse,
  SnapshotResponse,
  SpotifyFullPlaylist,
  SpotifyPlaylist,
  SpotifyPlaylistTrack,
  SpotifyUser,
} from "./schemas";
import {
  transformFullPlaylistToPlaylist,
  transformPlaylist,
  transformPlaylistTrack,
} from "./transformers";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export class SpotifyRepository implements Repository {
  constructor(private accessToken: string) {}

  async getMyPlaylists(): Promise<Result<Playlist[], SpotifyRepositoryError>> {
    const schema = createPaginatedResponse(SpotifyPlaylist);

    const result = await this.fetchAllPages<typeof SpotifyPlaylist>(
      "/me/playlists",
      schema,
      { limit: "50" },
    );

    if (result.isErr()) {
      return err(result.error);
    }

    return ok(result.value.map(transformPlaylist));
  }

  async getFullPlaylist(
    playlistId: string,
  ): Promise<Result<FullPlaylist, SpotifyRepositoryError>> {
    const playlistResult = await this.fetch(
      `/playlists/${playlistId}`,
      SpotifyFullPlaylist,
    );

    if (playlistResult.isErr()) {
      return err(playlistResult.error);
    }

    const playlistData = playlistResult.value;

    const tracksSchema = createPaginatedResponse(SpotifyPlaylistTrack);
    let allTracks = [...playlistData.tracks.items];

    if (playlistData.tracks.next) {
      const remainingResult = await this.fetchAllPagesFromUrl(
        playlistData.tracks.next,
        tracksSchema,
      );

      if (remainingResult.isErr()) {
        return err(remainingResult.error);
      }

      allTracks = [...allTracks, ...remainingResult.value];
    }

    const playlist = transformFullPlaylistToPlaylist(playlistData);
    const items = allTracks
      .map((track, idx) => transformPlaylistTrack(track, idx))
      .filter((item): item is PlaylistItem => item !== null);

    return ok({
      ...playlist,
      items,
    });
  }

  async addPlaylist(
    title: string,
    privacy: PlaylistPrivacy,
  ): Promise<Result<Playlist, SpotifyRepositoryError>> {
    const meResult = await this.fetch("/me", SpotifyUser);

    if (meResult.isErr()) {
      return err(meResult.error);
    }

    const userId = meResult.value.id;
    const isPublic = privacy === "public";

    const result = await this.fetch(
      `/users/${userId}/playlists`,
      SpotifyPlaylist,
      {},
      {
        method: "POST",
        body: JSON.stringify({
          name: title,
          public: isPublic,
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
  ): Promise<Result<PlaylistItem, SpotifyRepositoryError>> {
    const trackUri = `spotify:track:${resourceId}`;

    const result = await this.fetch(
      `/playlists/${playlistId}/tracks`,
      SnapshotResponse,
      {},
      {
        method: "POST",
        body: JSON.stringify({
          uris: [trackUri],
        }),
      },
    );

    if (result.isErr()) {
      return err(result.error);
    }

    return ok({
      id: result.value.snapshot_id,
      title: "",
      thumbnailUrl: "",
      position: 0,
      author: "",
      videoId: resourceId,
      url: `https://open.spotify.com/track/${resourceId}`,
    });
  }

  async removePlaylistItem(
    itemId: string,
    playlistId: string,
  ): Promise<Result<void, SpotifyRepositoryError>> {
    const trackUri = `spotify:track:${itemId}`;

    const response = await this.rawFetch(
      `/playlists/${playlistId}/tracks`,
      {},
      {
        method: "DELETE",
        body: JSON.stringify({
          tracks: [{ uri: trackUri }],
        }),
      },
    );

    if (!response.ok) {
      return err(SpotifyRepositoryError.fromHttpStatus(response.status));
    }

    return ok(undefined);
  }

  async updatePlaylistItemPosition(
    itemId: string,
    playlistId: string,
    _resourceId: string,
    position: number,
  ): Promise<Result<PlaylistItem, SpotifyRepositoryError>> {
    const fullPlaylistResult = await this.getFullPlaylist(playlistId);

    if (fullPlaylistResult.isErr()) {
      return err(fullPlaylistResult.error);
    }

    const currentPosition = fullPlaylistResult.value.items.findIndex(
      (item) => item.id === itemId || item.videoId === itemId,
    );

    if (currentPosition === -1) {
      return err(SpotifyRepositoryError.fromHttpStatus(404));
    }

    const result = await this.fetch(
      `/playlists/${playlistId}/tracks`,
      SnapshotResponse,
      {},
      {
        method: "PUT",
        body: JSON.stringify({
          range_start: currentPosition,
          insert_before: position > currentPosition ? position + 1 : position,
          range_length: 1,
        }),
      },
    );

    if (result.isErr()) {
      return err(result.error);
    }

    const item = fullPlaylistResult.value.items[currentPosition];
    return ok({
      ...item,
      position,
    });
  }

  async deletePlaylist(
    playlistId: string,
  ): Promise<Result<Playlist, SpotifyRepositoryError>> {
    const playlistResult = await this.fetch(
      `/playlists/${playlistId}`,
      SpotifyFullPlaylist,
    );

    if (playlistResult.isErr()) {
      return err(playlistResult.error);
    }

    const response = await this.rawFetch(
      `/playlists/${playlistId}/followers`,
      {},
      { method: "DELETE" },
    );

    if (!response.ok) {
      return err(SpotifyRepositoryError.fromHttpStatus(response.status));
    }

    return ok(transformFullPlaylistToPlaylist(playlistResult.value));
  }

  private async fetch<T extends ZodType>(
    path: string,
    schema: T,
    params: Record<string, string> = {},
    options: RequestInit = {},
  ): Promise<Result<T["_output"], SpotifyRepositoryError>> {
    const response = await this.rawFetch(path, params, options);

    if (!response.ok) {
      return err(SpotifyRepositoryError.fromHttpStatus(response.status));
    }

    const json = await response.json();
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return err(SpotifyRepositoryError.validationError(parsed.error.message));
    }

    return ok(parsed.data);
  }

  private async fetchAllPages<T extends ZodType>(
    path: string,
    schema: ZodType<PaginatedResponse<T["_output"]>>,
    params: Record<string, string>,
  ): Promise<Result<T["_output"][], SpotifyRepositoryError>> {
    const allItems: T["_output"][] = [];
    let offset = 0;
    const limit = Number.parseInt(params.limit ?? "50", 10);

    while (true) {
      const currentParams = { ...params, offset: offset.toString() };
      const result = await this.fetch(path, schema, currentParams);

      if (result.isErr()) {
        return err(result.error);
      }

      allItems.push(...result.value.items);

      if (!result.value.next) {
        break;
      }

      offset += limit;
    }

    return ok(allItems);
  }

  private async fetchAllPagesFromUrl<TItem>(
    startUrl: string,
    schema: ZodType<PaginatedResponse<TItem>>,
  ): Promise<Result<TItem[], SpotifyRepositoryError>> {
    const allItems: TItem[] = [];
    let nextUrl: string | null = startUrl;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        return err(SpotifyRepositoryError.fromHttpStatus(response.status));
      }

      const json = await response.json();
      const parsed = schema.safeParse(json);

      if (!parsed.success) {
        return err(
          SpotifyRepositoryError.validationError(parsed.error.message),
        );
      }

      allItems.push(...parsed.data.items);
      nextUrl = parsed.data.next;
    }

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
    const hasParams = params && Object.keys(params).length > 0;
    const searchParams = hasParams
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return `${SPOTIFY_API_BASE}${path}${searchParams}`;
  }
}
