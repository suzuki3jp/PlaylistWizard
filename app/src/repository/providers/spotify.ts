import { ApiClient as PackagedApiClient } from "@playlistwizard/spotify"; // Delete this renaming when ApiClient implementation migration to package is done
import { err, ok, type Result } from "neverthrow";

import { makeServerLogger } from "@/common/logger/server";
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
import {
  ApiClient,
  type IFullPlaylist,
  type IImage,
  type IPlaylist,
  type ITrack,
  Pagination,
  SpotifyApiError,
} from "./spotify-api";

const logger = makeServerLogger("SpotifyProviderRepository");

export class SpotifyProviderRepository implements ProviderRepositoryInterface {
  async getMinePlaylists(
    accessToken: string,
  ): Promise<Result<Playlist[], SpotifyProviderError>> {
    try {
      const client = new PackagedApiClient({ accessToken });
      const playlists = await (await client.playlist.getMine()).all();
      const adapterPlaylists: Playlist[] = playlists.map(
        (playlist) =>
          new Playlist({
            id: playlist.id,
            title: playlist.name,
            // biome-ignore lint/style/noNonNullAssertion: TODO
            thumbnailUrl: playlist.images?.getLargest()?.url!,
            itemsTotal: playlist.tracksTotal,
            url: playlist.url,
          }),
      );
      return ok(adapterPlaylists);
    } catch (error) {
      return err(SpotifyProviderError.from(error));
    }
  }

  async getPlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<Playlist, SpotifyProviderError>> {
    return await this.getFullPlaylist(playlistId, accessToken);
  }

  async getFullPlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<FullPlaylist, SpotifyProviderError>> {
    try {
      const client = new ApiClient(accessToken);
      const playlist = await client.getPlaylist(playlistId);
      const items = await new Pagination(playlist.tracks, client.token).all();
      const fullPlaylist = convertToFullPlaylist(playlist, items);
      return ok(fullPlaylist);
    } catch (error) {
      return err(SpotifyProviderError.from(error));
    }
  }

  async addPlaylistItem(
    playlistId: string,
    resourceId: string,
    accessToken: string,
  ): Promise<Result<PlaylistItem, SpotifyProviderError>> {
    try {
      // TODO: Spotify API はいっぺんにアイテムを追加できるエンドポイントがあるため、その差を吸収しつつ、Spotify の場合は一変に追加できるようにする
      const client = new ApiClient(accessToken);
      const playlistItem = await client.addPlaylistItem(playlistId, resourceId);
      // TODO: Do not use dummy data
      const adapterPlaylistItem = new PlaylistItem({
        id: playlistItem.snapshot_id,
        title: "",
        thumbnailUrl: "",
        position: 0,
        author: "",
        videoId: resourceId,
        url: "",
      });
      return ok(adapterPlaylistItem);
    } catch (error) {
      return err(SpotifyProviderError.from(error));
    }
  }

  async removePlaylistItem(
    itemId: string,
    playlistId: string,
    accessToken: string,
  ): Promise<Result<void, SpotifyProviderError>> {
    try {
      const client = new ApiClient(accessToken);
      await client.removePlaylistItem(playlistId, itemId);
      return ok();
    } catch (error) {
      return err(SpotifyProviderError.from(error));
    }
  }

  async updatePlaylistItemPosition(
    itemId: string,
    playlistId: string,
    resourceId: string,
    position: number,
    accessToken: string,
  ): Promise<Result<PlaylistItem, SpotifyProviderError>> {
    try {
      const client = new ApiClient(accessToken);
      const fullPlaylist = await client.getPlaylist(playlistId);
      const currentPosition = fullPlaylist.tracks.items.findIndex(
        (item) => item.track.id === itemId,
      );
      await client.updatePlaylistItemPosition(
        playlistId,
        currentPosition,
        position,
      );
      // TODO: Do not use dummy data
      return ok(
        new PlaylistItem({
          id: itemId,
          title: "",
          thumbnailUrl: "",
          position,
          author: "",
          videoId: resourceId,
          url: "",
        }),
      );
    } catch (error) {
      return err(SpotifyProviderError.from(error));
    }
  }

  async addPlaylist(
    title: string,
    status: PlaylistPrivacy,
    accessToken: string,
  ): Promise<Result<Playlist, SpotifyProviderError>> {
    try {
      const client = new ApiClient(accessToken);
      const me = await client.getMe();
      const playlist = await client.addPlaylist(
        me.id,
        title,
        status ? "public" : "private",
      );
      const adapterPlaylist = convertToPlaylist(playlist);
      return ok(adapterPlaylist);
    } catch (error) {
      return err(SpotifyProviderError.from(error));
    }
  }

  async deletePlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<Playlist, SpotifyProviderError>> {
    try {
      const client = new PackagedApiClient({ accessToken });
      await client.playlist.unfollow(playlistId);
      return ok(
        new Playlist({
          id: playlistId,
          title: "",
          thumbnailUrl: "",
          itemsTotal: 0,
          url: "",
        }),
      );
    } catch (error) {
      return err(SpotifyProviderError.from(error));
    }
  }
}

class SpotifyProviderError extends BaseProviderError {
  constructor(
    message: SpotifyProviderErrorMessage,
    public readonly code: SpotifyProviderErrorCode,
    public readonly status: SpotifyProviderErrorStatus,
  ) {
    super(message, code, status);
    this.name = "SpotifyProviderError";
  }

  /**
   * Generate a SpotifyProviderError instance from the given error
   * Handle known error codes to return a specific error instance
   * If the error is not recognized, return a SpotifyProviderError as unkown error
   * @param err
   */
  static from(error: unknown): SpotifyProviderError {
    if (error instanceof SpotifyProviderError) return error;

    if (error instanceof SpotifyApiError) {
      logger.debug(`Spotify API Error: ${error}`);
      const names = Object.keys(
        SpotifyProviderErrors,
      ) as SpotifyProviderErrorStatus[];
      for (const name of names) {
        if (error.code === SpotifyProviderErrors[name].code) {
          return makeError(name);
        }
      }
    }

    logger.debug(`Unknown error occurred: ${error}`);
    return makeError("UNKNOWN_ERROR");
  }
}

/**
 * Make a SpotifyProviderError instance from the given error status.
 * @param name
 * @returns
 */
function makeError(name: SpotifyProviderErrorStatus) {
  return new SpotifyProviderError(
    SpotifyProviderErrors[name].message,
    SpotifyProviderErrors[name].code,
    name,
  );
}

export const SpotifyProviderErrors = {
  UNKNOWN_ERROR: {
    code: 0,
    message: "UnknownError: An unknown error occurred during the request.",
  },
  EXPIRED_TOKEN: {
    code: 401,
    message: "ExpiredToken: The access token has expired.",
  },
} as const;

export type SpotifyProviderErrorCode =
  (typeof SpotifyProviderErrors)[keyof typeof SpotifyProviderErrors]["code"];

export type SpotifyProviderErrorMessage =
  (typeof SpotifyProviderErrors)[keyof typeof SpotifyProviderErrors]["message"];

export type SpotifyProviderErrorStatus = keyof typeof SpotifyProviderErrors;

/**
 * =============================================
 * =============================================
 * Entity converters for Spotify API
 * =============================================
 * =============================================
 */

/**
 * Convert a Spotify playlist to an Playlist.
 * @param playlist
 * @returns
 */
export function convertToPlaylist(playlist: IPlaylist): Playlist {
  const thumbnailUrl = getThumbnailUrl(playlist.images);
  if (!thumbnailUrl) throw makeError("UNKNOWN_ERROR");
  const obj = new Playlist({
    id: playlist.id,
    title: playlist.name,
    thumbnailUrl,
    itemsTotal: playlist.tracks.total,
    url: playlist.external_urls.spotify,
  });
  return obj;
}

/**
 * Convert a Spotify full playlist to an FullPlaylist.
 * @param playlist
 * @param items
 * @returns
 */
export function convertToFullPlaylist(
  playlist: IFullPlaylist,
  items: ITrack[],
): FullPlaylist {
  const thumbnailUrl = getThumbnailUrl(playlist.images);
  if (!thumbnailUrl) throw makeError("UNKNOWN_ERROR");
  return new FullPlaylist({
    id: playlist.id,
    title: playlist.name,
    thumbnailUrl,
    itemsTotal: playlist.tracks.total,
    url: playlist.external_urls.spotify,
    items: items.map((item, idx) => {
      const thumbnailUrl = getThumbnailUrl(item.track.album.images, true);
      if (!thumbnailUrl) throw makeError("UNKNOWN_ERROR");
      return new PlaylistItem({
        id: item.track.id,
        title: item.track.name,
        thumbnailUrl,
        position: idx,
        author: item.track.artists.map((a) => a.name).join(" & "),
        videoId: item.track.id,
        url: item.track.external_urls.spotify,
      });
    }),
  });
}

/**
 * Get the thumbnail URL from the given images.
 * By default, it returns the first image.
 * If the last option is true, it returns the last image.
 * @param images
 * @param last
 * @returns
 */
function getThumbnailUrl(images: IImage[] | null, last?: boolean): string {
  if (!images || images.length === 0) {
    return "https://dummyimage.com/600x400/8f8f8f/8f8f8f";
  }
  if (last) {
    return images[images.length - 1].url;
  }
  return images[0].url;
}
