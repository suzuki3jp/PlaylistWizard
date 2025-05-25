// TODO: Ignore biome errors entire this file when biome 2.0 is released https://github.com/biomejs/biome/issues/4305
import { describe, expect, it } from "vitest";

import { BUG_REPORT } from "../constants";
import { PlaylistItem, type RawPlaylistItem } from "./PlaylistItem";

describe("PlaylistItem", () => {
  const validRaw: RawPlaylistItem = {
    id: "item123",
    snippet: {
      title: "Test Video",
      thumbnails: {
        default: { url: "http://img.youtube.com/vi/test/default.jpg" },
      },
      position: 0,
      videoOwnerChannelTitle: "Test Channel",
      resourceId: {
        videoId: "video123",
        kind: "youtube#video",
      },
    },
  };

  it("should create a PlaylistItem with correct properties", () => {
    const item = new PlaylistItem(validRaw);
    expect(item.id).toBe("item123");
    expect(item.title).toBe("Test Video");
    expect(item.thumbnails).toBeInstanceOf(Object);
    expect(item.position).toBe(0);
    expect(item.channelName).toBe("Test Channel");
    expect(item.videoId).toBe("video123");
    expect(item.url).toBe("https://www.youtube.com/watch?v=video123");
  });

  it("should throw if id is missing", () => {
    const raw = { ...validRaw, id: undefined } as unknown as RawPlaylistItem;
    expect(() => new PlaylistItem(raw)).toThrow(
      `YouTube API returned an unexpected undefined value for "id of PlaylistItem". ${BUG_REPORT}`,
    );
  });

  it("should throw if snippet is missing", () => {
    const raw = {
      ...validRaw,
      snippet: undefined,
    } as unknown as RawPlaylistItem;
    expect(() => new PlaylistItem(raw)).toThrow(
      `YouTube API returned an unexpected undefined value for "snippet of PlaylistItem". ${BUG_REPORT}`,
    );
  });

  it("should throw if snippet.thumbnails is missing", () => {
    const raw = {
      ...validRaw,
      snippet: { ...validRaw.snippet, thumbnails: undefined },
    } as unknown as RawPlaylistItem;
    expect(() => new PlaylistItem(raw)).toThrow(
      `YouTube API returned an unexpected undefined value for "snippet.thumbnails of PlaylistItem". ${BUG_REPORT}`,
    );
  });

  it("should throw if snippet.title is missing", () => {
    const raw = {
      ...validRaw,
      snippet: { ...validRaw.snippet, title: undefined },
    } as unknown as RawPlaylistItem;
    expect(() => new PlaylistItem(raw)).toThrow(
      `YouTube API returned an unexpected undefined value for "snippet.title of PlaylistItem". ${BUG_REPORT}`,
    );
  });

  it("should throw if snippet.position is not a number", () => {
    const raw = {
      ...validRaw,
      snippet: { ...validRaw.snippet, position: undefined },
    } as unknown as RawPlaylistItem;
    expect(() => new PlaylistItem(raw)).toThrow(
      `YouTube API returned an unexpected undefined value for "snippet.position of PlaylistItem". ${BUG_REPORT}`,
    );
  });

  it("should throw if snippet.videoOwnerChannelTitle is missing", () => {
    const raw = {
      ...validRaw,
      snippet: { ...validRaw.snippet, videoOwnerChannelTitle: undefined },
    } as unknown as RawPlaylistItem;
    expect(() => new PlaylistItem(raw)).toThrow(
      `YouTube API returned an unexpected undefined value for "snippet.videoOwnerChannelTitle of PlaylistItem". ${BUG_REPORT}`,
    );
  });

  it("should throw if snippet.resourceId is missing", () => {
    const raw = {
      ...validRaw,
      snippet: { ...validRaw.snippet, resourceId: undefined },
    } as unknown as RawPlaylistItem;
    expect(() => new PlaylistItem(raw)).toThrow(
      `YouTube API returned an unexpected undefined value for "snippet.resourceId of PlaylistItem". ${BUG_REPORT}`,
    );
  });

  it("should throw if snippet.resourceId.videoId is missing", () => {
    const raw = {
      ...validRaw,
      snippet: {
        ...validRaw.snippet,
        resourceId: { ...validRaw.snippet?.resourceId, videoId: undefined },
      },
    } as unknown as RawPlaylistItem;
    expect(() => new PlaylistItem(raw)).toThrow(
      `YouTube API returned an unexpected undefined value for "snippet.resourceId.videoId of PlaylistItem". ${BUG_REPORT}`,
    );
  });
});
