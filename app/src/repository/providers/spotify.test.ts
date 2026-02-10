import { describe, expect, it } from "vitest";
import { Provider } from "@/entities/provider";
import { convertToFullPlaylist, convertToPlaylist } from "./spotify";
import type { IFullPlaylist, IImage, IPlaylist, ITrack } from "./spotify-api";

function createMockPlaylist(overrides?: Partial<IPlaylist>): IPlaylist {
  return {
    collaborative: false,
    description: "Test playlist",
    external_urls: { spotify: "https://open.spotify.com/playlist/abc123" },
    href: "https://api.spotify.com/v1/playlists/abc123",
    id: "abc123",
    images: [{ url: "https://example.com/image.jpg", height: 300, width: 300 }],
    name: "Test Playlist",
    owner: {
      external_urls: { spotify: "https://open.spotify.com/user/user1" },
      href: "https://api.spotify.com/v1/users/user1",
      id: "user1",
      type: "user",
      uri: "spotify:user:user1",
      display_name: "User 1",
    },
    public: true,
    snapshot_id: "snap1",
    tracks: {
      href: "https://api.spotify.com/v1/playlists/abc123/tracks",
      total: 10,
    },
    type: "playlist",
    uri: "spotify:playlist:abc123",
    ...overrides,
  };
}

function createMockFullPlaylist(
  overrides?: Partial<IFullPlaylist>,
): IFullPlaylist {
  return {
    ...createMockPlaylist(),
    tracks: {
      href: "https://api.spotify.com/v1/playlists/abc123/tracks",
      limit: 100,
      next: null,
      offset: 0,
      previous: null,
      total: 2,
      items: [],
    },
    ...overrides,
  };
}

function createMockTrack(overrides?: {
  id?: string;
  name?: string;
  artists?: { name: string }[];
  albumImages?: IImage[];
}): ITrack {
  return {
    track: {
      album: {
        images: overrides?.albumImages ?? [
          {
            url: "https://example.com/album-large.jpg",
            height: 640,
            width: 640,
          },
          { url: "https://example.com/album-small.jpg", height: 64, width: 64 },
        ],
      },
      artists: (overrides?.artists ?? [{ name: "Artist A" }]).map((a) => ({
        external_urls: { spotify: "https://open.spotify.com/artist/art1" },
        href: "https://api.spotify.com/v1/artists/art1",
        id: "art1",
        name: a.name,
        type: "artist",
        uri: "spotify:artist:art1",
      })),
      external_urls: {
        spotify: `https://open.spotify.com/track/${overrides?.id ?? "track1"}`,
      },
      id: overrides?.id ?? "track1",
      name: overrides?.name ?? "Track 1",
      uri: `spotify:track:${overrides?.id ?? "track1"}`,
    },
  };
}

describe("convertToPlaylist", () => {
  it("should map all fields correctly", () => {
    const mockPlaylist = createMockPlaylist();
    const result = convertToPlaylist(mockPlaylist);

    expect(result).toEqual({
      id: "abc123",
      title: "Test Playlist",
      thumbnailUrl: "https://example.com/image.jpg",
      itemsTotal: 10,
      url: "https://open.spotify.com/playlist/abc123",
      provider: Provider.SPOTIFY,
    });
  });

  it("should set provider to SPOTIFY", () => {
    const result = convertToPlaylist(createMockPlaylist());
    expect(result.provider).toBe(Provider.SPOTIFY);
  });

  it("should use dummy URL when images is null", () => {
    const mockPlaylist = createMockPlaylist({ images: null });
    const result = convertToPlaylist(mockPlaylist);
    expect(result.thumbnailUrl).toBe(
      "https://dummyimage.com/600x400/8f8f8f/8f8f8f",
    );
  });

  it("should use dummy URL when images is empty array", () => {
    const mockPlaylist = createMockPlaylist({ images: [] });
    const result = convertToPlaylist(mockPlaylist);
    expect(result.thumbnailUrl).toBe(
      "https://dummyimage.com/600x400/8f8f8f/8f8f8f",
    );
  });
});

describe("convertToFullPlaylist", () => {
  it("should map playlist and items correctly", () => {
    const mockPlaylist = createMockFullPlaylist();
    const items: ITrack[] = [
      createMockTrack({ id: "t1", name: "Song 1" }),
      createMockTrack({ id: "t2", name: "Song 2" }),
    ];

    const result = convertToFullPlaylist(mockPlaylist, items);

    expect(result.id).toBe("abc123");
    expect(result.title).toBe("Test Playlist");
    expect(result.provider).toBe(Provider.SPOTIFY);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe("t1");
    expect(result.items[0].title).toBe("Song 1");
    expect(result.items[1].id).toBe("t2");
    expect(result.items[1].title).toBe("Song 2");
  });

  it("should set position from array index", () => {
    const mockPlaylist = createMockFullPlaylist();
    const items: ITrack[] = [
      createMockTrack({ id: "t1" }),
      createMockTrack({ id: "t2" }),
      createMockTrack({ id: "t3" }),
    ];

    const result = convertToFullPlaylist(mockPlaylist, items);

    expect(result.items[0].position).toBe(0);
    expect(result.items[1].position).toBe(1);
    expect(result.items[2].position).toBe(2);
  });

  it("should join multiple artists with ' & '", () => {
    const mockPlaylist = createMockFullPlaylist();
    const items: ITrack[] = [
      createMockTrack({
        artists: [{ name: "Artist A" }, { name: "Artist B" }],
      }),
    ];

    const result = convertToFullPlaylist(mockPlaylist, items);

    expect(result.items[0].author).toBe("Artist A & Artist B");
  });

  it("should use the last album image for item thumbnail", () => {
    const mockPlaylist = createMockFullPlaylist();
    const items: ITrack[] = [
      createMockTrack({
        albumImages: [
          { url: "https://example.com/large.jpg", height: 640, width: 640 },
          { url: "https://example.com/medium.jpg", height: 300, width: 300 },
          { url: "https://example.com/small.jpg", height: 64, width: 64 },
        ],
      }),
    ];

    const result = convertToFullPlaylist(mockPlaylist, items);

    expect(result.items[0].thumbnailUrl).toBe("https://example.com/small.jpg");
  });

  it("should use dummy URL when playlist images is null", () => {
    const mockPlaylist = createMockFullPlaylist({ images: null });
    const result = convertToFullPlaylist(mockPlaylist, []);
    expect(result.thumbnailUrl).toBe(
      "https://dummyimage.com/600x400/8f8f8f/8f8f8f",
    );
  });

  it("should use dummy URL when playlist images is empty", () => {
    const mockPlaylist = createMockFullPlaylist({ images: [] });
    const result = convertToFullPlaylist(mockPlaylist, []);
    expect(result.thumbnailUrl).toBe(
      "https://dummyimage.com/600x400/8f8f8f/8f8f8f",
    );
  });

  it("should use dummy URL when album images is empty", () => {
    const mockPlaylist = createMockFullPlaylist();
    const items: ITrack[] = [createMockTrack({ albumImages: [] })];

    const result = convertToFullPlaylist(mockPlaylist, items);

    expect(result.items[0].thumbnailUrl).toBe(
      "https://dummyimage.com/600x400/8f8f8f/8f8f8f",
    );
  });

  it("should set videoId and url from track data", () => {
    const mockPlaylist = createMockFullPlaylist();
    const items: ITrack[] = [createMockTrack({ id: "mytrack" })];

    const result = convertToFullPlaylist(mockPlaylist, items);

    expect(result.items[0].videoId).toBe("mytrack");
    expect(result.items[0].url).toBe("https://open.spotify.com/track/mytrack");
  });
});
