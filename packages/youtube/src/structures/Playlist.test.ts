import { describe, expect, it } from "vitest";

import { Playlist, type RawPlaylist } from "./Playlist";

describe("Playlist", () => {
  const mockRawPlaylist: RawPlaylist = {
    id: "playlist123",
    snippet: {
      title: "Test Playlist",
      thumbnails: {
        default: { url: "default.jpg", width: 120, height: 90 },
        medium: { url: "medium.jpg", width: 320, height: 180 },
        high: { url: "high.jpg", width: 480, height: 360 },
      },
    },
    contentDetails: {
      itemCount: 10,
    },
  };

  it("should create a Playlist instance with correct properties", () => {
    const playlist = new Playlist(mockRawPlaylist);

    expect(playlist.id).toBe("playlist123");
    expect(playlist.title).toBe("Test Playlist");
    expect(playlist.itemsTotal).toBe(10);
    expect(playlist.url).toBe(
      "https://www.youtube.com/playlist?list=playlist123",
    );
    expect(playlist.thumbnails).toBeDefined();
  });

  it("should throw error when required fields are missing", () => {
    const invalidPlaylist: RawPlaylist = {
      snippet: {
        thumbnails: {},
      },
    };

    expect(() => new Playlist(invalidPlaylist)).toThrow();
  });

  it("should not throw error when itemCount is 0", () => {
    const playlistWithZeroItems: RawPlaylist = {
      id: "playlist123",
      snippet: {
        title: "Empty Playlist",
        thumbnails: {
          default: { url: "default.jpg", width: 120, height: 90 },
          medium: { url: "medium.jpg", width: 320, height: 180 },
          high: { url: "high.jpg", width: 480, height: 360 },
        },
      },
      contentDetails: {
        itemCount: 0,
      },
    };

    const playlist = new Playlist(playlistWithZeroItems);
    expect(playlist.itemsTotal).toBe(0);
  });

  it("should return correct JSON representation", () => {
    const playlist = new Playlist(mockRawPlaylist);
    const json = playlist.toJSON();

    expect(json).toEqual({
      id: "playlist123",
      title: "Test Playlist",
      thumbnails: playlist.thumbnails,
      itemsTotal: 10,
      url: "https://www.youtube.com/playlist?list=playlist123",
    });
  });
});
