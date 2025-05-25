import type { youtube_v3 } from "googleapis";

import { BUG_REPORT } from "../constants";
import { Thumbnails } from "./Thumbnails";

/**
 * @internal This is exported for testing purposes only.
 */
export type RawPlaylistItem = youtube_v3.Schema$PlaylistItem;

export type IPlaylistItem = {
  /**
   * Unique identifier for the playlist item of YouTube
   */
  id: string;

  /**
   * Title of the playlist item
   */
  title: string;

  /**
   * Thumbnail of the playlist item
   */
  thumbnails: Thumbnails;

  /**
   * The order in which the item appears in the playlist. The value uses a zero-based index, so the first item has a position of 0, the second item has a position of 1, and so forth.
   */
  position: number;

  /**
   * Author of the video in the playlist item
   */
  channelName: string;

  /**
   * Unique identifier for the video
   */
  videoId: string;

  /**
   * URL of the video
   */
  url: string;
};

/**
 * The PlaylistItem class represents a YouTube playlist item.
 */
export class PlaylistItem implements IPlaylistItem {
  public readonly id: string;
  public readonly title: string;
  public readonly thumbnails: Thumbnails;
  public readonly position: number;
  public readonly channelName: string;
  public readonly videoId: string;
  public readonly url: string;

  constructor(raw: RawPlaylistItem) {
    if (!raw.id) this.throwUnexpectedUndefined("id");
    if (!raw.snippet) this.throwUnexpectedUndefined("snippet");
    if (!raw.snippet.thumbnails)
      this.throwUnexpectedUndefined("snippet.thumbnails");
    if (!raw.snippet.title) this.throwUnexpectedUndefined("snippet.title");
    if (typeof raw.snippet.position !== "number")
      this.throwUnexpectedUndefined("snippet.position");
    if (!raw.snippet.videoOwnerChannelTitle)
      this.throwUnexpectedUndefined("snippet.videoOwnerChannelTitle");
    if (!raw.snippet.resourceId)
      this.throwUnexpectedUndefined("snippet.resourceId");
    if (!raw.snippet.resourceId.videoId)
      this.throwUnexpectedUndefined("snippet.resourceId.videoId");

    this.id = raw.id;
    this.title = raw.snippet.title;
    this.thumbnails = new Thumbnails(raw.snippet.thumbnails);
    this.position = raw.snippet.position;
    this.channelName = raw.snippet.videoOwnerChannelTitle;
    this.videoId = raw.snippet.resourceId.videoId;
    this.url = `https://www.youtube.com/watch?v=${this.videoId}`;
  }

  private throwUnexpectedUndefined(property: string): never {
    throw new Error(
      `YouTube API returned an unexpected undefined value for "${property} of PlaylistItem". ${BUG_REPORT}`,
    );
  }
}
