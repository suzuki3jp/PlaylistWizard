import type { youtube_v3 } from "googleapis";

import { BUG_REPORT } from "../constants";

/**
 * @internal This is exported for testing purposes only.
 */
export type RawThumbnails = youtube_v3.Schema$ThumbnailDetails;

export type IThumbnails = {
  getLargest: () => Thumbnail | null;
  getSmallest: () => Thumbnail | null;
  getByQuality: (quality: keyof RawThumbnails) => Thumbnail | null;
};

/**
 * The Thumbnails class represents a collection of YouTube video or playlist thumbnails.
 */
export class Thumbnails implements IThumbnails {
  private data: Record<keyof RawThumbnails, Thumbnail | null>;
  constructor(private readonly raw: RawThumbnails) {
    this.data = {
      default: null,
      standard: null,
      high: null,
      maxres: null,
      medium: null,
    };

    for (const r of Object.entries(this.raw)) {
      const [key, value] = r as [keyof RawThumbnails, RawThumbnail];
      if (value) {
        this.data[key] = new Thumbnail(value);
      }
    }
  }

  /**
   * Returns the largest thumbnail.
   * @returns
   */
  getLargest() {
    return (
      this.data.maxres ??
      this.data.high ??
      this.data.medium ??
      this.data.standard ??
      this.data.default ??
      null
    );
  }

  /**
   * Returns the smallest thumbnail.
   * @returns
   */
  getSmallest() {
    return (
      this.data.default ??
      this.data.standard ??
      this.data.medium ??
      this.data.high ??
      this.data.maxres ??
      null
    );
  }

  /**
   * Returns a thumbnail by its quality.
   * @param quality The quality of the thumbnail to retrieve.
   * @returns The thumbnail object or null if not available.
   */
  getByQuality(quality: keyof RawThumbnails) {
    return this.data[quality];
  }
}

type RawThumbnail = youtube_v3.Schema$Thumbnail;

export type IThumbnail = {
  url: string;
  width: number;
  height: number;
};

export class Thumbnail implements IThumbnail {
  constructor(private raw: RawThumbnail) {}

  // YouTube API probably always returns these values as string
  // But official SDK type definition is string | undefined

  get url() {
    if (this.raw.url === undefined || this.raw.url === null) {
      this.throwUnexpectedUndefined("url");
    }
    return this.raw.url;
  }

  get width() {
    if (this.raw.width === undefined || this.raw.width === null) {
      this.throwUnexpectedUndefined("width");
    }
    return this.raw.width;
  }

  get height() {
    if (this.raw.height === undefined || this.raw.height === null) {
      this.throwUnexpectedUndefined("height");
    }
    return this.raw.height;
  }

  private throwUnexpectedUndefined(key: string): never {
    throw new Error(
      `YouTube API returned undefined for ${key} of Thumbnail. ${BUG_REPORT}`,
    );
  }
}
