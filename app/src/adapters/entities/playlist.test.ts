import { describe, expect, it } from "vitest";

import {
  AdapterPlaylist,
  type IAdapterPlaylist,
} from "@/adapters/entities/playlist";

describe("AdapterPlaylist", () => {
  const data: IAdapterPlaylist = {
    id: "123",
    title: "Test Playlist",
    thumbnailUrl: "https://example.com/thumbnail.jpg",
    itemsTotal: 10,
    url: "https://example.com/playlist",
  };

  it("should create an instance with the correct properties", () => {
    const playlist = new AdapterPlaylist(data);
    expect(playlist.id).toBe(data.id);
    expect(playlist.title).toBe(data.title);
    expect(playlist.thumbnailUrl).toBe(data.thumbnailUrl);
    expect(playlist.itemsTotal).toBe(data.itemsTotal);
    expect(playlist.url).toBe(data.url);
  });

  it("should return the correct JSON representation", () => {
    const playlist = new AdapterPlaylist(data);
    const json = playlist.toJSON();
    expect(json).toEqual(data);
  });
});
