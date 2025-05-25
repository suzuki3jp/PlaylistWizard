import { ApiClient, YouTubeApiClient } from "@playlistwizard/youtube";
import type { GaxiosError } from "gaxios";
import type { youtube_v3 } from "googleapis";
import { type Result, err, ok } from "neverthrow";

import { BaseAdapter, BaseAdapterError } from "@/adapters/base-adapter";
import {
  AdapterFullPlaylist,
  AdapterPlaylist,
  AdapterPlaylistItem,
  type AdapterPlaylistPrivacy,
} from "@/adapters/entities";

export class YouTubeAdapter extends BaseAdapter {
  private client: YouTubeApiClient;

  constructor() {
    super();
    this.client = new YouTubeApiClient();
  }

  async getPlaylists(
    accessToken: string,
  ): Promise<Result<AdapterPlaylist[], YoutubeAdapterError>> {
    try {
      const client = new ApiClient({ accessToken });
      const data = (await (await client.playlist.getMine()).all()).flat();
      const playlists = data.map<AdapterPlaylist>(
        (item) =>
          new AdapterPlaylist({
            ...item,
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            thumbnailUrl: item.thumbnails.getLargest()?.url!,
          }),
      );

      return ok(playlists);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  async getFullPlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<AdapterFullPlaylist, YoutubeAdapterError>> {
    const client = new ApiClient({ accessToken });

    try {
      const result = await this.getPlaylist(playlistId, accessToken);
      if (result.isErr()) throw result.error;
      const playlist = result.value;
      const playlistItems = (
        await (await client.playlistItem.getByPlaylistId(playlistId)).all()
      ).flat();

      const obj = new AdapterFullPlaylist({
        id: playlist.id,
        title: playlist.title,
        thumbnailUrl: playlist.thumbnailUrl,
        itemsTotal: playlist.itemsTotal,
        items: playlistItems.map(
          (item) =>
            new AdapterPlaylistItem({
              id: item.id,
              title: item.title,
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              thumbnailUrl: item.thumbnails.getSmallest()?.url!,
              position: item.position,
              author: item.channelName,
              url: item.url,
              videoId: item.videoId,
            }),
        ),
        url: playlist.url,
      });
      return ok(obj);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  async getPlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<AdapterPlaylist, YoutubeAdapterError>> {
    try {
      const res = await this.client.getPlaylistByPlaylistId(
        playlistId,
        accessToken,
      );

      if (!res.items) throw makeError("UNKNOWN_ERROR");
      const item = convertToPlaylist(res.items[0]);

      return ok(item);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  async addPlaylist(
    title: string,
    status: AdapterPlaylistPrivacy,
    accessToken: string,
  ): Promise<Result<AdapterPlaylist, YoutubeAdapterError>> {
    try {
      const res = await this.client.addPlaylist(title, status, accessToken);
      const playlist = convertToPlaylist(res);
      return ok(playlist);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  async updatePlaylistItemPosition(
    itemId: string,
    playlistId: string,
    resourceId: string,
    position: number,
    accessToken: string,
  ): Promise<Result<AdapterPlaylistItem, YoutubeAdapterError>> {
    try {
      const res = await this.client.updatePlaylistItem(
        itemId,
        playlistId,
        resourceId,
        position,
        accessToken,
      );
      const playlistItem = convertToPlaylistItem(res);
      if (!playlistItem) throw makeError("UNKNOWN_ERROR"); // item will never be a private video.
      return ok(playlistItem);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  async deletePlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<AdapterPlaylist, YoutubeAdapterError>> {
    try {
      const playlist = await this.getPlaylist(playlistId, accessToken);

      if (playlist.isErr()) throw playlist.error;
      const res = await this.client.deletePlaylist(
        playlist.value.id,
        accessToken,
      );
      if (res === 204) return playlist;
      throw makeError("UNKNOWN_ERROR");
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  async addPlaylistItem(
    playlistId: string,
    resourceId: string,
    accessToken: string,
  ): Promise<Result<AdapterPlaylistItem, YoutubeAdapterError>> {
    try {
      const res = await this.client.addPlaylistItem(
        playlistId,
        resourceId,
        accessToken,
      );
      const item = convertToPlaylistItem(res);
      if (!item) throw makeError("UNKNOWN_ERROR"); // item will never be a private video.
      return ok(item);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  private handleError(err: unknown): YoutubeAdapterError {
    if (err instanceof YoutubeAdapterError) return err;

    if ((err as GaxiosError).response) {
      const e = err as GaxiosError;
      const names = Object.keys(
        YoutubeAdapterErrorCodes,
      ) as (keyof typeof YoutubeAdapterErrorCodes)[];

      for (const name of names) {
        if (e.status === YoutubeAdapterErrorCodes[name].code) {
          return makeError(name);
        }
      }
    }

    return makeError("UNKNOWN_ERROR");
  }
}

class YoutubeAdapterError extends BaseAdapterError {
  constructor(
    message: ErrorMessage,
    public readonly code: ErrorCode,
    public readonly status: ErrorStatus,
  ) {
    super(message, code, status);
    this.name = "YoutubeAdapterError";
  }

  static fromUnkwonError() {}
}

/**
 * Make a YouTubeAdapterError instance from the given error status.
 * @param name
 * @returns
 */
function makeError(name: ErrorStatus) {
  return new YoutubeAdapterError(
    YoutubeAdapterErrorCodes[name].message,
    YoutubeAdapterErrorCodes[name].code,
    name,
  );
}

export const YoutubeAdapterErrorCodes = {
  UNAUTHORIZED: {
    code: 401,
    message: "Unauthorized: invalid access_token",
  },
  /**
   * クォータ制限の時はこのコードが返されるかも
   */
  FORBIDDEN: {
    code: 403,
    message: "Forbidden: permission denied",
  },
  NOT_FOUND: {
    code: 404,
    message: "NotFound: could not find the resource",
  },
  /**
   * playlistItems.insert とかでたまにこのエラーが発生する。
   * 同じ条件でも安定して発生するわけではないので、おそらくリクエストの間隔が短すぎることが原因？
   */
  CONFLICT: {
    code: 409,
    message: "Conflict: resource already exist",
  },
  TOO_MANY_REQUESTS: {
    code: 429,
    message: "TooManyRequests: Youtube API daily quota exceeded",
  },
  UNKNOWN_ERROR: {
    code: 0,
    message: "UnknownError: An unknown error occurred during the request",
  },
} as const;

type ErrorCode =
  (typeof YoutubeAdapterErrorCodes)[keyof typeof YoutubeAdapterErrorCodes]["code"];

type ErrorMessage =
  (typeof YoutubeAdapterErrorCodes)[keyof typeof YoutubeAdapterErrorCodes]["message"];

type ErrorStatus = keyof typeof YoutubeAdapterErrorCodes;

/**
 * =============================================
 * =============================================
 * Entity converters for YouTube Data API v3
 * =============================================
 * =============================================
 */

/**
 * Convert the given API response to a Playlist instance.
 * @param res
 * @returns
 */
export function convertToPlaylist(
  res: youtube_v3.Schema$Playlist,
): AdapterPlaylist {
  if (
    !res.id ||
    !res.snippet ||
    !res.snippet.title ||
    !res.snippet.thumbnails ||
    typeof res.contentDetails?.itemCount !== "number"
  )
    throw makeError("UNKNOWN_ERROR");

  const thumbnailUrl = getThumbnailUrlFromAPIData(res.snippet.thumbnails);
  if (!thumbnailUrl) throw makeError("UNKNOWN_ERROR");

  const obj = new AdapterPlaylist({
    id: res.id,
    title: res.snippet.title,
    thumbnailUrl,
    itemsTotal: res.contentDetails.itemCount,
    url: `https://www.youtube.com/playlist?list=${res.id}`,
  });
  return obj;
}

/**
 * Convert the given API response to a PlaylistItem instance.
 * If the owner of the video is a topic channel, it will be trimmed.
 * @param items
 * @returns
 */
export function convertToPlaylistItem(
  res: youtube_v3.Schema$PlaylistItem,
): AdapterPlaylistItem | null {
  if (res.status?.privacyStatus === "private") return null;

  if (
    !res.id ||
    !res.snippet ||
    !res.snippet.title ||
    !res.snippet.resourceId ||
    !res.snippet.resourceId.videoId ||
    typeof res.snippet.position !== "number" ||
    !res.snippet.videoOwnerChannelTitle ||
    !res.snippet.thumbnails
  )
    throw makeError("UNKNOWN_ERROR");

  const thumbnailUrl = getThumbnailUrlFromAPIData(res.snippet.thumbnails, true);
  if (!thumbnailUrl) throw makeError("UNKNOWN_ERROR");

  const obj = new AdapterPlaylistItem({
    id: res.id,
    title: res.snippet.title,
    thumbnailUrl,
    position: res.snippet.position,
    // Youtube Music の曲などのアイテムでは "OwnerName - Topic" という形式で返されるため " - Topic" をトリミングする
    author: res.snippet.videoOwnerChannelTitle
      .replace(/\s*-\s*Topic$/, "")
      .trim(),
    videoId: res.snippet.resourceId.videoId,
    url: `https://www.youtube.com/watch?v=${res.snippet.resourceId.videoId}`,
  });
  return obj;
}

/**
 * Get the thumbnail URL from the given API response data.
 * It will return the URL of the highest resolution thumbnail.
 * @param data
 * @returns
 */
export function getThumbnailUrlFromAPIData(
  data: youtube_v3.Schema$ThumbnailDetails,
  smallest?: boolean,
): string | undefined {
  let url = data.default?.url;

  if (smallest) {
    if (data.maxres?.url) {
      url = data.maxres?.url;
    }
    if (data.high?.url) {
      url = data.high?.url;
    }
    if (data.standard?.url) {
      url = data.standard?.url;
    }
    if (data.medium?.url) {
      url = data.medium?.url;
    }
    return url ?? undefined;
  }

  if (data.medium?.url) {
    url = data.medium?.url;
  }
  if (data.high?.url) {
    url = data.high?.url;
  }
  if (data.standard?.url) {
    url = data.standard?.url;
  }
  if (data.maxres?.url) {
    url = data.maxres?.url;
  }

  return url ?? undefined;
}
