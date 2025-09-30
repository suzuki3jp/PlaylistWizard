import { describe, expect, it } from "vitest";

import { Playlist } from "./playlist";

describe("Playlist", () => {
  it("can be created from primitive data", () => {
    const primitiveData = {
      id: "playlist1",
      title: "My Playlist",
      thumbnailUrl: "https://example.com/thumbnail.jpg",
      itemsTotal: 10,
      url: "https://example.com/playlist",
    };

    const playlist = Playlist.parse(primitiveData);

    expect(playlist.id).toBe(primitiveData.id);
    expect(playlist.title).toBe(primitiveData.title);
    expect(playlist.thumbnailUrl).toBe(primitiveData.thumbnailUrl);
    expect(playlist.itemsTotal).toBe(primitiveData.itemsTotal);
    expect(playlist.url).toBe(primitiveData.url);
  });

  it("throws an error for invalid data", () => {
    const invalidData = {
      id: "playlist1",
      title: "My Playlist",
      thumbnailUrl: "not-a-valid-url",
      itemsTotal: -5,
      url: "https://example.com/playlist",
    };

    expect(() => Playlist.parse(invalidData)).toThrow();
  });

  it("can be created from class instance data", () => {
    const primitiveData = {
      id: "playlist2",
      title: "Another Playlist",
      thumbnailUrl: "https://example.com/thumbnail2.jpg",
      itemsTotal: 20,
      url: "https://example.com/playlist2",
    };

    const playlistData = Playlist.parse(primitiveData);
    const playlistInstance = new PlaylistClass(playlistData);
    const playlist = Playlist.parse(playlistInstance);

    expect(playlist.id).toBe(primitiveData.id);
    expect(playlist.title).toBe(primitiveData.title);
    expect(playlist.thumbnailUrl).toBe(primitiveData.thumbnailUrl);
    expect(playlist.itemsTotal).toBe(primitiveData.itemsTotal);
    expect(playlist.url).toBe(primitiveData.url);
  });
});

class PlaylistClass {
  public id: string;
  public title: string;
  public thumbnailUrl: string;
  public itemsTotal: number;
  public url: string;

  constructor({ id, title, thumbnailUrl, itemsTotal, url }: Playlist) {
    this.id = id;
    this.title = title;
    this.thumbnailUrl = thumbnailUrl;
    this.itemsTotal = itemsTotal;
    this.url = url;
  }
}
