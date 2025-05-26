import {
  ApiClient,
  type Playlist,
  type PlaylistItem,
} from "@playlistwizard/youtube";
import type { GaxiosError } from "gaxios";
import { type Result, err, ok } from "neverthrow";

import { BaseAdapter, BaseAdapterError } from "@/adapters/base-adapter";
import {
  AdapterFullPlaylist,
  AdapterPlaylist,
  AdapterPlaylistItem,
  type AdapterPlaylistPrivacy,
} from "@/adapters/entities";

export class YouTubeAdapter extends BaseAdapter {
  async getPlaylists(
    accessToken: string,
  ): Promise<Result<AdapterPlaylist[], YoutubeAdapterError>> {
    try {
      const client = new ApiClient({ accessToken });
      const data = (await (await client.playlist.getMine()).all()).flat();
      const playlists = data.map<AdapterPlaylist>(convertToAdapterPlaylist);

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
      const playlist = await client.playlist.getById(playlistId);
      if (!playlist) throw makeError("NOT_FOUND");
      const playlistItems = (
        await (await client.playlistItem.getByPlaylistId(playlistId)).all()
      ).flat();

      const obj = new AdapterFullPlaylist({
        id: playlist.id,
        title: playlist.title,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        thumbnailUrl: playlist.thumbnails.getLargest()?.url!,
        itemsTotal: playlist.itemsTotal,
        items: playlistItems.map(convertToAdapterPlaylistItem),
        url: playlist.url,
      });
      return ok(obj);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  async addPlaylist(
    title: string,
    privacy: AdapterPlaylistPrivacy,
    accessToken: string,
  ): Promise<Result<AdapterPlaylist, YoutubeAdapterError>> {
    try {
      const client = new ApiClient({ accessToken });
      const res = await client.playlist.create({ title, privacy });

      return ok(
        new AdapterPlaylist({
          id: res.id,
          title: res.title,
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          thumbnailUrl: res.thumbnails.getLargest()?.url!,
          itemsTotal: res.itemsTotal,
          url: `https://www.youtube.com/playlist?list=${res.id}`,
        }),
      );
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
      const client = new ApiClient({ accessToken });
      const res = await client.playlistItem.updatePosition(
        playlistId,
        itemId,
        resourceId,
        position,
      );
      return ok(convertToAdapterPlaylistItem(res));
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  async deletePlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<AdapterPlaylist, YoutubeAdapterError>> {
    const client = new ApiClient({ accessToken });

    try {
      const playlist = await client.playlist.getById(playlistId);
      if (!playlist) throw makeError("NOT_FOUND");

      const res = await client.playlist.delete(playlist.id);
      if (res === 204)
        return ok(
          new AdapterPlaylist({
            id: playlist.id,
            title: playlist.title,
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            thumbnailUrl: playlist.thumbnails.getLargest()?.url!,
            itemsTotal: 0,
            url: `https://www.youtube.com/playlist?list=${playlist.id}`,
          }),
        );
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
      const client = new ApiClient({ accessToken });
      const res = await client.playlistItem.create(playlistId, resourceId);
      return ok(convertToAdapterPlaylistItem(res));
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

function convertToAdapterPlaylist(item: Playlist): AdapterPlaylist {
  return new AdapterPlaylist({
    id: item.id,
    title: item.title,
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    thumbnailUrl: item.thumbnails.getLargest()?.url!,
    itemsTotal: item.itemsTotal,
    url: `https://www.youtube.com/playlist?list=${item.id}`,
  });
}

function convertToAdapterPlaylistItem(item: PlaylistItem): AdapterPlaylistItem {
  return new AdapterPlaylistItem({
    id: item.id,
    title: item.title,
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    thumbnailUrl: item.thumbnails.getSmallest()?.url!,
    position: item.position,
    author: item.channelName,
    videoId: item.videoId,
    url: item.url,
  });
}
