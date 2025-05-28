import { describe, expect, it } from "vitest";
import { Playlist, type RawPlaylist } from "./Playlist";

describe("Playlist", () => {
  const mockRawPlaylist: RawPlaylist = {
    collaborative: false,
    description: "Test playlist",
    external_urls: {
      spotify: "https://open.spotify.com/playlist/123",
    },
    href: "https://api.spotify.com/v1/playlists/123",
    id: "123",
    images: [
      {
        height: 640,
        width: 640,
        url: "https://example.com/image.jpg",
      },
    ],
    name: "Test Playlist",
    owner: {
      external_urls: {
        spotify: "https://open.spotify.com/user/123",
      },
      href: "https://api.spotify.com/v1/users/123",
      id: "123",
      type: "user",
      uri: "spotify:user:123",
      display_name: "Test User",
    },
    public: true,
    snapshot_id: "MTY3NjQyMjE5MiwwMDAwMDAwMGQ0MWQ4Y2Q5",
    tracks: {
      href: "https://api.spotify.com/v1/playlists/123/tracks",
      total: 10,
    },
    type: "playlist",
    uri: "spotify:playlist:123",
  };

  it("should create a Playlist instance with correct properties", () => {
    const playlist = new Playlist(mockRawPlaylist);

    expect(playlist.id).toBe("123");
    expect(playlist.name).toBe("Test Playlist");
    expect(playlist.tracksTotal).toBe(10);
    expect(playlist.url).toBe("https://open.spotify.com/playlist/123");
    expect(playlist.images).toBeDefined();
    expect(playlist.images?.getLargest()?.url).toBe(
      "https://example.com/image.jpg",
    );
  });

  it("should handle null images", () => {
    const playlistWithoutImages = {
      ...mockRawPlaylist,
      images: null,
    };

    const playlist = new Playlist(playlistWithoutImages);
    expect(playlist.images).toBeNull();
  });

  it("should return raw playlist data", () => {
    const playlist = new Playlist(mockRawPlaylist);
    expect(playlist.getRaw()).toEqual(mockRawPlaylist);
  });
});
