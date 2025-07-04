import { describe, expect, it } from "vitest";

import {
  PlaylistItem,
  type PrimitivePlaylistItemInterface,
} from "./playlist-item";

describe("AdapterPlaylistItem", () => {
  const data: PrimitivePlaylistItemInterface = {
    id: "123",
    title: "Test Title",
    thumbnailUrl: "https://example.com/thumbnail.jpg",
    position: 1,
    author: "Test Author",
    videoId: "abc123",
    url: "https://example.com/video",
  };

  it("should create an instance with the correct properties", () => {
    const item = new PlaylistItem(data);
    expect(item.id).toBe(data.id);
    expect(item.title).toBe(data.title);
    expect(item.thumbnailUrl).toBe(data.thumbnailUrl);
    expect(item.position).toBe(data.position);
    expect(item.author).toBe(data.author);
    expect(item.videoId).toBe(data.videoId);
    expect(item.url).toBe(data.url);
  });

  it("should return the correct JSON representation", () => {
    const item = new PlaylistItem(data);
    const json = item.toJSON();
    expect(json).toEqual(data);
  });
});
