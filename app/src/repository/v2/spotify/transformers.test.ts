import { describe, expect, it } from "vitest";
import { Provider } from "@/entities/provider";
import type { SpotifyFullPlaylist, SpotifyPlaylist } from "./schemas/playlist";
import type { SpotifyPlaylistTrack } from "./schemas/track";
import {
  transformFullPlaylistToPlaylist,
  transformPlaylist,
  transformPlaylistTrack,
} from "./transformers";

function createMockSpotifyPlaylist(
  overrides?: Partial<SpotifyPlaylist>,
): SpotifyPlaylist {
  return {
    id: "sp-playlist-1",
    name: "My Spotify Playlist",
    images: [
      { url: "https://i.scdn.co/image/large", width: 640, height: 640 },
      { url: "https://i.scdn.co/image/small", width: 64, height: 64 },
    ],
    owner: {
      id: "user1",
      display_name: "User 1",
      external_urls: { spotify: "https://open.spotify.com/user/user1" },
    },
    tracks: {
      href: "https://api.spotify.com/v1/playlists/sp-playlist-1/tracks",
      total: 15,
    },
    external_urls: {
      spotify: "https://open.spotify.com/playlist/sp-playlist-1",
    },
    public: true,
    ...overrides,
  };
}

function createMockSpotifyFullPlaylist(
  overrides?: Partial<SpotifyFullPlaylist>,
): SpotifyFullPlaylist {
  return {
    id: "sp-playlist-1",
    name: "My Spotify Playlist",
    images: [
      { url: "https://i.scdn.co/image/large", width: 640, height: 640 },
      { url: "https://i.scdn.co/image/small", width: 64, height: 64 },
    ],
    owner: {
      id: "user1",
      display_name: "User 1",
      external_urls: { spotify: "https://open.spotify.com/user/user1" },
    },
    tracks: {
      href: "https://api.spotify.com/v1/playlists/sp-playlist-1/tracks",
      total: 2,
      items: [],
      next: null,
      previous: null,
      limit: 100,
      offset: 0,
    },
    external_urls: {
      spotify: "https://open.spotify.com/playlist/sp-playlist-1",
    },
    public: true,
    ...overrides,
  };
}

function createMockPlaylistTrack(
  overrides?: Partial<{
    id: string;
    name: string;
    artists: { name: string }[];
    albumImages: { url: string; width: number | null; height: number | null }[];
    trackNull: boolean;
  }>,
): SpotifyPlaylistTrack {
  if (overrides?.trackNull) {
    return { track: null, added_at: "2024-01-01T00:00:00Z" };
  }
  return {
    track: {
      id: overrides?.id ?? "track1",
      name: overrides?.name ?? "Test Track",
      artists: (overrides?.artists ?? [{ name: "Artist A" }]).map((a) => ({
        id: "artist1",
        name: a.name,
        external_urls: { spotify: "https://open.spotify.com/artist/artist1" },
      })),
      album: {
        id: "album1",
        name: "Test Album",
        images: overrides?.albumImages ?? [
          {
            url: "https://i.scdn.co/image/album-large",
            width: 640,
            height: 640,
          },
          { url: "https://i.scdn.co/image/album-small", width: 64, height: 64 },
        ],
        external_urls: { spotify: "https://open.spotify.com/album/album1" },
      },
      external_urls: {
        spotify: `https://open.spotify.com/track/${overrides?.id ?? "track1"}`,
      },
    },
    added_at: "2024-01-01T00:00:00Z",
  };
}

describe("transformPlaylist", () => {
  it("should map all fields correctly", () => {
    const playlist = createMockSpotifyPlaylist();
    const result = transformPlaylist(playlist);

    expect(result).toEqual({
      id: "sp-playlist-1",
      title: "My Spotify Playlist",
      thumbnailUrl: "https://i.scdn.co/image/large",
      itemsTotal: 15,
      url: "https://open.spotify.com/playlist/sp-playlist-1",
      provider: Provider.SPOTIFY,
    });
  });

  it("should set provider to Provider.SPOTIFY", () => {
    const result = transformPlaylist(createMockSpotifyPlaylist());
    expect(result.provider).toBe(Provider.SPOTIFY);
  });

  it("should use default thumbnail when images is null", () => {
    const playlist = createMockSpotifyPlaylist({ images: null });
    const result = transformPlaylist(playlist);
    expect(result.thumbnailUrl).toBe(
      "https://dummyimage.com/600x400/8f8f8f/8f8f8f",
    );
  });

  it("should use default thumbnail when images is empty", () => {
    const playlist = createMockSpotifyPlaylist({ images: [] });
    const result = transformPlaylist(playlist);
    expect(result.thumbnailUrl).toBe(
      "https://dummyimage.com/600x400/8f8f8f/8f8f8f",
    );
  });

  it("should select largest image by area", () => {
    const playlist = createMockSpotifyPlaylist({
      images: [
        { url: "https://i.scdn.co/image/small", width: 64, height: 64 },
        { url: "https://i.scdn.co/image/large", width: 640, height: 640 },
        { url: "https://i.scdn.co/image/medium", width: 300, height: 300 },
      ],
    });
    const result = transformPlaylist(playlist);
    expect(result.thumbnailUrl).toBe("https://i.scdn.co/image/large");
  });
});

describe("transformFullPlaylistToPlaylist", () => {
  it("should map all fields correctly", () => {
    const playlist = createMockSpotifyFullPlaylist();
    const result = transformFullPlaylistToPlaylist(playlist);

    expect(result).toEqual({
      id: "sp-playlist-1",
      title: "My Spotify Playlist",
      thumbnailUrl: "https://i.scdn.co/image/large",
      itemsTotal: 2,
      url: "https://open.spotify.com/playlist/sp-playlist-1",
      provider: Provider.SPOTIFY,
    });
  });

  it("should use default thumbnail when images is null", () => {
    const playlist = createMockSpotifyFullPlaylist({ images: null });
    const result = transformFullPlaylistToPlaylist(playlist);
    expect(result.thumbnailUrl).toBe(
      "https://dummyimage.com/600x400/8f8f8f/8f8f8f",
    );
  });
});

describe("transformPlaylistTrack", () => {
  it("should map all fields correctly", () => {
    const track = createMockPlaylistTrack({ id: "t1", name: "My Song" });
    const result = transformPlaylistTrack(track, 3);

    expect(result).toEqual({
      id: "t1",
      title: "My Song",
      thumbnailUrl: "https://i.scdn.co/image/album-small",
      position: 3,
      author: "Artist A",
      videoId: "t1",
      url: "https://open.spotify.com/track/t1",
    });
  });

  it("should return null when track is null", () => {
    const track = createMockPlaylistTrack({ trackNull: true });
    const result = transformPlaylistTrack(track, 0);
    expect(result).toBeNull();
  });

  it("should join multiple artists with ' & '", () => {
    const track = createMockPlaylistTrack({
      artists: [
        { name: "Artist A" },
        { name: "Artist B" },
        { name: "Artist C" },
      ],
    });
    const result = transformPlaylistTrack(track, 0);
    expect(result?.author).toBe("Artist A & Artist B & Artist C");
  });

  it("should select smallest album image", () => {
    const track = createMockPlaylistTrack({
      albumImages: [
        { url: "https://i.scdn.co/image/large", width: 640, height: 640 },
        { url: "https://i.scdn.co/image/tiny", width: 32, height: 32 },
        { url: "https://i.scdn.co/image/medium", width: 300, height: 300 },
      ],
    });
    const result = transformPlaylistTrack(track, 0);
    expect(result?.thumbnailUrl).toBe("https://i.scdn.co/image/tiny");
  });

  it("should handle images with null dimensions", () => {
    const track = createMockPlaylistTrack({
      albumImages: [
        { url: "https://i.scdn.co/image/a", width: null, height: null },
        { url: "https://i.scdn.co/image/b", width: 300, height: 300 },
      ],
    });
    const result = transformPlaylistTrack(track, 0);
    // null dimensions treated as 0, so area is 0 (smallest)
    expect(result?.thumbnailUrl).toBe("https://i.scdn.co/image/a");
  });
});
