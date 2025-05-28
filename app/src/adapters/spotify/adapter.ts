import { ApiClient as PackagedApiClient } from "@playlistwizard/spotify"; // Delete this renaming when ApiClient implementation migration to package is done
import { type Result, err, ok } from "neverthrow";

import { BaseAdapter, BaseAdapterError } from "@/adapters/base-adapter";
import {
  AdapterFullPlaylist,
  AdapterPlaylist,
  AdapterPlaylistItem,
  type AdapterPlaylistPrivacy,
} from "@/adapters/entities";
import {
  ApiClient,
  type IFullPlaylist,
  type IImage,
  type IPlaylist,
  type ITrack,
  Pagination,
  SpotifyApiError,
} from "./api-client";

export class SpotifyAdapter extends BaseAdapter {
  async getPlaylists(
    accessToken: string,
  ): Promise<Result<AdapterPlaylist[], SpotifyAdapterError>> {
    try {
      const client = new PackagedApiClient({ accessToken });
      const playlists = await (await client.playlist.getMine()).all();
      const adapterPlaylists: AdapterPlaylist[] = playlists.map(
        (playlist) =>
          new AdapterPlaylist({
            id: playlist.id,
            title: playlist.name,
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            thumbnailUrl: playlist.images?.getLargest()?.url!,
            itemsTotal: playlist.tracksTotal,
            url: playlist.url,
          }),
      );
      return ok(adapterPlaylists);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  async getPlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<AdapterPlaylist, SpotifyAdapterError>> {
    return await this.getFullPlaylist(playlistId, accessToken);
  }

  async getFullPlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<AdapterFullPlaylist, SpotifyAdapterError>> {
    try {
      const client = new ApiClient(accessToken);
      const playlist = await client.getPlaylist(playlistId);
      const items = await new Pagination(playlist.tracks, client.token).all();
      const fullPlaylist = convertToFullPlaylist(playlist, items);
      return ok(fullPlaylist);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  async addPlaylistItem(
    playlistId: string,
    resourceId: string,
    accessToken: string,
  ): Promise<Result<AdapterPlaylistItem, SpotifyAdapterError>> {
    try {
      // TODO: Spotify API はいっぺんにアイテムを追加できるエンドポイントがあるため、その差を吸収しつつ、Spotify の場合は一変に追加できるようにする
      const client = new ApiClient(accessToken);
      const playlistItem = await client.addPlaylistItem(playlistId, resourceId);
      // TODO: Do not use dummy data
      const adapterPlaylistItem = new AdapterPlaylistItem({
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
      return err(this.handleError(error));
    }
  }

  async updatePlaylistItemPosition(
    itemId: string,
    playlistId: string,
    resourceId: string,
    position: number,
    accessToken: string,
  ): Promise<Result<AdapterPlaylistItem, SpotifyAdapterError>> {
    try {
      const client = new ApiClient(accessToken);
      const fullPlaylist = await client.getPlaylist(playlistId);
      const currentPosition = fullPlaylist.tracks.items.findIndex(
        (item) => item.track.id === itemId,
      );
      const playlistItem = await client.updatePlaylistItemPosition(
        playlistId,
        currentPosition,
        position,
      );
      // TODO: Do not use dummy data
      return ok(
        new AdapterPlaylistItem({
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
      return err(this.handleError(error));
    }
  }

  async addPlaylist(
    title: string,
    status: AdapterPlaylistPrivacy,
    accessToken: string,
  ): Promise<Result<AdapterPlaylist, SpotifyAdapterError>> {
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
      return err(this.handleError(error));
    }
  }

  async deletePlaylist(
    playlistId: string,
    accessToken: string,
  ): Promise<Result<AdapterPlaylist, SpotifyAdapterError>> {
    try {
      const client = new PackagedApiClient({ accessToken });
      await client.playlist.unfollow(playlistId);
      return ok(
        new AdapterPlaylist({
          id: playlistId,
          title: "",
          thumbnailUrl: "",
          itemsTotal: 0,
          url: "",
        }),
      );
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  private handleError(error: unknown): SpotifyAdapterError {
    if (error instanceof SpotifyAdapterError) return error;
    if (error instanceof SpotifyApiError) {
      if (error.code === 401) {
        return makeError("EXPIRED_TOKEN");
      }
      return makeError("UNKNOWN_ERROR");
    }

    return makeError("UNKNOWN_ERROR");
  }
}

class SpotifyAdapterError extends BaseAdapterError {
  constructor(
    message: ErrorMessage,
    public readonly code: ErrorCode,
    public readonly status: ErrorStatus,
  ) {
    super(message, code, status);
    this.name = "SpotifyAdapterError";
  }
}

/**
 * Make a SpotifyAdapterError instance from the given error status.
 * @param name
 * @returns
 */
function makeError(name: ErrorStatus) {
  return new SpotifyAdapterError(
    SpotifyAdapterErrorCode[name].message,
    SpotifyAdapterErrorCode[name].code,
    name,
  );
}

export const SpotifyAdapterErrorCode = {
  UNKNOWN_ERROR: {
    code: 0,
    message: "UnknownError: An unknown error occurred during the request.",
  },
  EXPIRED_TOKEN: {
    code: 401,
    message: "ExpiredToken: The access token has expired.",
  },
} as const;

type ErrorCode =
  (typeof SpotifyAdapterErrorCode)[keyof typeof SpotifyAdapterErrorCode]["code"];

type ErrorMessage =
  (typeof SpotifyAdapterErrorCode)[keyof typeof SpotifyAdapterErrorCode]["message"];

type ErrorStatus = keyof typeof SpotifyAdapterErrorCode;

/**
 * =============================================
 * =============================================
 * Entity converters for Spotify API
 * =============================================
 * =============================================
 */

/**
 * Convert a Spotify playlist to an AdapterPlaylist.
 * @param playlist
 * @returns
 */
export function convertToPlaylist(playlist: IPlaylist): AdapterPlaylist {
  const thumbnailUrl = getThumbnailUrl(playlist.images);
  if (!thumbnailUrl) throw makeError("UNKNOWN_ERROR");
  const obj = new AdapterPlaylist({
    id: playlist.id,
    title: playlist.name,
    thumbnailUrl,
    itemsTotal: playlist.tracks.total,
    url: playlist.external_urls.spotify,
  });
  return obj;
}

/**
 * Convert a Spotify full playlist to an AdapterFullPlaylist.
 * @param playlist
 * @param items
 * @returns
 */
export function convertToFullPlaylist(
  playlist: IFullPlaylist,
  items: ITrack[],
): AdapterFullPlaylist {
  const thumbnailUrl = getThumbnailUrl(playlist.images);
  if (!thumbnailUrl) throw makeError("UNKNOWN_ERROR");
  return new AdapterFullPlaylist({
    id: playlist.id,
    title: playlist.name,
    thumbnailUrl,
    itemsTotal: playlist.tracks.total,
    url: playlist.external_urls.spotify,
    items: items.map((item, idx) => {
      const thumbnailUrl = getThumbnailUrl(item.track.album.images, true);
      if (!thumbnailUrl) throw makeError("UNKNOWN_ERROR");
      return new AdapterPlaylistItem({
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
