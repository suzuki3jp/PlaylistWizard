import {
  ApiClient,
  type PlaylistItem as YouTubePlaylistItem,
  type Playlist as YoutubePlaylist,
} from "@playlistwizard/youtube";
import type { GaxiosError } from "gaxios";
import { type Result, err, ok } from "neverthrow";

import { logger as ServerLogger } from "@/common/logger/server";
import {
  FullPlaylist,
  Playlist,
  PlaylistItem,
  type PlaylistPrivacy,
} from "@/entity";
import {
  BaseProviderError,
  type ProviderRepositoryInterface,
} from "@/usecase/interface/provider";

const logger = ServerLogger.makeChild("YoutubeProviderRepository");

export class YoutubeProviderRepository implements ProviderRepositoryInterface {
  async getMinePlaylists(
    accessToken: string,
  ): Promise<Result<Playlist[], YouTubeProviderError>> {
    try {
      const client = new ApiClient({ accessToken });
      const data = (await (await client.playlist.getMine()).all()).flat();
      const playlists = data.map(convertProviderPlaylistToEntity);

      return ok(playlists);
    } catch (error) {
      return err(YouTubeProviderError.from(error));
    }
  }

  async getFullPlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<FullPlaylist, YouTubeProviderError>> {
    try {
      const client = new ApiClient({ accessToken });
      const playlist = await client.playlist.getById(playlistId);
      if (!playlist) throw makeError("NOT_FOUND");
      const playlistItems = (
        await (await client.playlistItem.getByPlaylistId(playlistId)).all()
      ).flat();

      const obj = new FullPlaylist({
        id: playlist.id,
        title: playlist.title,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        thumbnailUrl: playlist.thumbnails.getLargest()?.url!,
        itemsTotal: playlist.itemsTotal,
        items: playlistItems.map(convertProviderPlaylistItemToEntity),
        url: playlist.url,
      });
      return ok(obj);
    } catch (error) {
      return err(YouTubeProviderError.from(error));
    }
  }

  async addPlaylist(
    title: string,
    privacy: PlaylistPrivacy,
    accessToken: string,
  ): Promise<Result<Playlist, YouTubeProviderError>> {
    try {
      const client = new ApiClient({ accessToken });
      const res = await client.playlist.create({ title, privacy });

      return ok(
        new Playlist({
          id: res.id,
          title: res.title,
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          thumbnailUrl: res.thumbnails.getLargest()?.url!,
          itemsTotal: res.itemsTotal,
          url: `https://www.youtube.com/playlist?list=${res.id}`,
        }),
      );
    } catch (error) {
      return err(YouTubeProviderError.from(error));
    }
  }

  async addPlaylistItem(
    playlistId: string,
    resourceId: string,
    accessToken: string,
  ): Promise<Result<PlaylistItem, YouTubeProviderError>> {
    try {
      const client = new ApiClient({ accessToken });
      const res = await client.playlistItem.create(playlistId, resourceId);
      return ok(convertProviderPlaylistItemToEntity(res));
    } catch (error) {
      return err(YouTubeProviderError.from(error));
    }
  }

  async updatePlaylistItemPosition(
    itemId: string,
    playlistId: string,
    resourceId: string,
    position: number,
    accessToken: string,
  ): Promise<Result<PlaylistItem, YouTubeProviderError>> {
    try {
      const client = new ApiClient({ accessToken });
      const res = await client.playlistItem.updatePosition(
        playlistId,
        itemId,
        resourceId,
        position,
      );
      return ok(convertProviderPlaylistItemToEntity(res));
    } catch (error) {
      return err(YouTubeProviderError.from(error));
    }
  }

  async deletePlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<Playlist, YouTubeProviderError>> {
    try {
      const client = new ApiClient({ accessToken });
      const playlist = await client.playlist.getById(playlistId);
      if (!playlist) throw makeError("NOT_FOUND");

      const res = await client.playlist.delete(playlist.id);
      if (res === 204)
        return ok(
          new Playlist({
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
      return err(YouTubeProviderError.from(error));
    }
  }
}

class YouTubeProviderError extends BaseProviderError {
  constructor(
    message: YouTubeProviderErrorMessage,
    public readonly code: YoutubeProviderErrorCode,
    public readonly status: YouTubeProviderErrorStatus,
  ) {
    super(message, code, status);
    this.name = "YouTubeProviderError";
  }

  /**
   * Generate a YouTubeProviderError instance from the given error
   * Handle known error codes to return a specific error instance
   * If the error is not recognized, return a YouTubeProviderError as unkown error
   * @param err
   */
  static from(err: unknown): YouTubeProviderError {
    if (err instanceof YouTubeProviderError) return err;

    if ((err as GaxiosError).response) {
      logger.debug(`Gaxios error occurred: ${err}`);
      const e = err as GaxiosError;
      const names = Object.keys(
        YouTubePrivderErrors,
      ) as YouTubeProviderErrorStatus[];

      for (const name of names) {
        if (e.status === YouTubePrivderErrors[name].code) {
          return makeError(name);
        }
      }
    }

    logger.debug(`Unknown error occurred: ${err}`);
    return makeError("UNKNOWN_ERROR");
  }
}

/**
 * Make a YouTubeProviderError instance from the given error status.
 * @param name
 * @returns
 */
function makeError(name: YouTubeProviderErrorStatus) {
  return new YouTubeProviderError(
    YouTubePrivderErrors[name].message,
    YouTubePrivderErrors[name].code,
    name,
  );
}

export const YouTubePrivderErrors = {
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

export type YoutubeProviderErrorCode =
  (typeof YouTubePrivderErrors)[keyof typeof YouTubePrivderErrors]["code"];

export type YouTubeProviderErrorMessage =
  (typeof YouTubePrivderErrors)[keyof typeof YouTubePrivderErrors]["message"];

export type YouTubeProviderErrorStatus = keyof typeof YouTubePrivderErrors;

function convertProviderPlaylistToEntity(item: YoutubePlaylist): Playlist {
  return new Playlist({
    id: item.id,
    title: item.title,
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    thumbnailUrl: item.thumbnails.getLargest()?.url!,
    itemsTotal: item.itemsTotal,
    url: `https://www.youtube.com/playlist?list=${item.id}`,
  });
}

function convertProviderPlaylistItemToEntity(
  item: YouTubePlaylistItem,
): PlaylistItem {
  return new PlaylistItem({
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
