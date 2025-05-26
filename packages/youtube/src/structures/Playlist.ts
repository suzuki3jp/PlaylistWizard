import type { youtube_v3 } from "googleapis";

import { isNullish } from "../Page";
import { BUG_REPORT } from "../constants";
import { Thumbnails } from "./Thumbnails";

/**
 * @internal This is exported for testing purposes only.
 */
export type RawPlaylist = youtube_v3.Schema$Playlist;

export type PlaylistPrivacyStatus = "public" | "unlisted" | "private";

/**
 * Playlist interface
 */
export type IPlaylist = {
  /**
   * Unique identifier for the playlist of YouTube
   */
  id: string;

  /**
   * Title of the playlist
   */
  title: string;

  /**
   * Thumbnail of the playlist
   */
  thumbnails: Thumbnails;

  /**
   * Number of items in the playlist
   */
  itemsTotal: number;

  /**
   * URL of the playlist
   * format: https://www.youtube.com/playlist?list={id}
   */
  url: string;
};

/**
 * The Playlist class represents a YouTube playlist.
 */
export class Playlist implements IPlaylist {
  public readonly id: string;
  public readonly title: string;
  public readonly thumbnails: Thumbnails;
  public readonly itemsTotal: number;
  public readonly url: string;

  constructor(raw: RawPlaylist) {
    // We always set the part parameter of Request to "id,snippet,contentDetails"
    // So, we can assume that the raw object has these properties.
    if (!raw.id) this.throwUnexpectedUndefined("id");
    if (!raw.snippet) this.throwUnexpectedUndefined("snippet");
    if (!raw.contentDetails) this.throwUnexpectedUndefined("contentDetails");
    if (!raw.snippet.thumbnails)
      this.throwUnexpectedUndefined("snippet.thumbnaills");
    if (!raw.snippet.title) this.throwUnexpectedUndefined("snippet.title");
    if (isNullish(raw.contentDetails.itemCount))
      this.throwUnexpectedUndefined("contentDetails.itemCount");

    this.id = raw.id;
    this.title = raw.snippet.title;
    this.thumbnails = new Thumbnails(raw.snippet.thumbnails);
    this.itemsTotal = Number(raw.contentDetails.itemCount);
    this.url = `https://www.youtube.com/playlist?list=${this.id}`;
  }

  private throwUnexpectedUndefined(key: string): never {
    throw new Error(
      `YouTube API returned undefined for ${key} of Playlist. ${BUG_REPORT}`,
    );
  }
}
