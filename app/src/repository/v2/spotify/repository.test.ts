import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlaylistPrivacy } from "@/features/playlist/entities";
import { SpotifyRepository } from "./repository";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(data: unknown, ok = true, status = 200) {
  return { ok, status, json: () => Promise.resolve(data) };
}

function createSpotifyPlaylist(overrides?: Record<string, unknown>) {
  return {
    id: overrides?.id ?? "sp-pl-1",
    name: overrides?.name ?? "Test Playlist",
    images: overrides?.images ?? [
      { url: "https://i.scdn.co/image/large", width: 640, height: 640 },
    ],
    owner: {
      id: "user1",
      display_name: "User 1",
      external_urls: { spotify: "https://open.spotify.com/user/user1" },
    },
    tracks: overrides?.tracks ?? {
      href: `https://api.spotify.com/v1/playlists/${overrides?.id ?? "sp-pl-1"}/tracks`,
      total: 5,
    },
    external_urls: {
      spotify: `https://open.spotify.com/playlist/${overrides?.id ?? "sp-pl-1"}`,
    },
    public: true,
  };
}

function createSpotifyFullPlaylist(overrides?: Record<string, unknown>) {
  return {
    id: overrides?.id ?? "sp-pl-1",
    name: overrides?.name ?? "Test Playlist",
    images: overrides?.images ?? [
      { url: "https://i.scdn.co/image/large", width: 640, height: 640 },
    ],
    owner: {
      id: "user1",
      display_name: "User 1",
      external_urls: { spotify: "https://open.spotify.com/user/user1" },
    },
    tracks: overrides?.tracks ?? {
      href: "https://api.spotify.com/v1/playlists/sp-pl-1/tracks",
      total: 0,
      items: [],
      next: null,
      previous: null,
      limit: 100,
      offset: 0,
    },
    external_urls: {
      spotify: `https://open.spotify.com/playlist/${overrides?.id ?? "sp-pl-1"}`,
    },
    public: true,
  };
}

function createSpotifyTrack(overrides?: Record<string, unknown>) {
  const id = (overrides?.id as string) ?? "track1";
  return {
    track: {
      id,
      name: overrides?.name ?? "Test Track",
      artists: [
        {
          id: "artist1",
          name: "Artist A",
          external_urls: { spotify: "https://open.spotify.com/artist/artist1" },
        },
      ],
      album: {
        id: "album1",
        name: "Test Album",
        images: [
          { url: "https://i.scdn.co/image/album", width: 64, height: 64 },
        ],
        external_urls: { spotify: "https://open.spotify.com/album/album1" },
      },
      external_urls: { spotify: `https://open.spotify.com/track/${id}` },
    },
    added_at: "2024-01-01T00:00:00Z",
  };
}

function createPaginatedResponse(
  items: unknown[],
  next: string | null = null,
  offset = 0,
) {
  return {
    href: "https://api.spotify.com/v1/me/playlists",
    items,
    limit: 50,
    next,
    offset,
    previous: null,
    total: items.length,
  };
}

describe("SpotifyRepository", () => {
  let repo: SpotifyRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    repo = new SpotifyRepository("test-access-token");
  });

  describe("getMyPlaylists", () => {
    it("should return playlists on success", async () => {
      const playlists = [
        createSpotifyPlaylist({ id: "pl1" }),
        createSpotifyPlaylist({ id: "pl2" }),
      ];
      mockFetch.mockResolvedValueOnce(
        mockResponse(createPaginatedResponse(playlists)),
      );

      const result = await repo.getMyPlaylists();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(2);
      expect(result._unsafeUnwrap()[0].id).toBe("pl1");
    });

    it("should handle pagination", async () => {
      const page1 = [createSpotifyPlaylist({ id: "pl1" })];
      const page2 = [createSpotifyPlaylist({ id: "pl2" })];

      mockFetch
        .mockResolvedValueOnce(
          mockResponse(
            createPaginatedResponse(
              page1,
              "https://api.spotify.com/v1/me/playlists?offset=50",
            ),
          ),
        )
        .mockResolvedValueOnce(mockResponse(createPaginatedResponse(page2)));

      const result = await repo.getMyPlaylists();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should return error on HTTP failure", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(null, false, 401));

      const result = await repo.getMyPlaylists();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("UNAUTHORIZED");
    });

    it("should return VALIDATION_ERROR on invalid response", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ invalid: "data" }));

      const result = await repo.getMyPlaylists();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("VALIDATION_ERROR");
    });

    it("should send correct request parameters", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse(createPaginatedResponse([])),
      );

      await repo.getMyPlaylists();

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.origin + url.pathname).toBe(
        "https://api.spotify.com/v1/me/playlists",
      );
      expect(url.searchParams.get("limit")).toBe("50");

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers.Authorization).toBe("Bearer test-access-token");
    });
  });

  describe("getFullPlaylist", () => {
    it("should return full playlist with items", async () => {
      const tracks = [
        createSpotifyTrack({ id: "t1" }),
        createSpotifyTrack({ id: "t2" }),
      ];
      const playlist = createSpotifyFullPlaylist({
        tracks: {
          href: "https://api.spotify.com/v1/playlists/sp-pl-1/tracks",
          total: 2,
          items: tracks,
          next: null,
          previous: null,
          limit: 100,
          offset: 0,
        },
      });
      mockFetch.mockResolvedValueOnce(mockResponse(playlist));

      const result = await repo.getFullPlaylist("sp-pl-1");

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.id).toBe("sp-pl-1");
      expect(data.items).toHaveLength(2);
      expect(data.items[0].videoId).toBe("t1");
    });

    it("should fetch additional pages when tracks.next is present", async () => {
      const firstPageTracks = [createSpotifyTrack({ id: "t1" })];
      const playlist = createSpotifyFullPlaylist({
        tracks: {
          href: "https://api.spotify.com/v1/playlists/sp-pl-1/tracks",
          total: 2,
          items: firstPageTracks,
          next: "https://api.spotify.com/v1/playlists/sp-pl-1/tracks?offset=100",
          previous: null,
          limit: 100,
          offset: 0,
        },
      });
      const secondPage = createPaginatedResponse(
        [createSpotifyTrack({ id: "t2" })],
        null,
        100,
      );

      mockFetch
        .mockResolvedValueOnce(mockResponse(playlist))
        .mockResolvedValueOnce(mockResponse(secondPage));

      const result = await repo.getFullPlaylist("sp-pl-1");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().items).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should filter out null tracks", async () => {
      const tracks = [
        createSpotifyTrack({ id: "t1" }),
        { track: null, added_at: "2024-01-01T00:00:00Z" },
      ];
      const playlist = createSpotifyFullPlaylist({
        tracks: {
          href: "https://api.spotify.com/v1/playlists/sp-pl-1/tracks",
          total: 2,
          items: tracks,
          next: null,
          previous: null,
          limit: 100,
          offset: 0,
        },
      });
      mockFetch.mockResolvedValueOnce(mockResponse(playlist));

      const result = await repo.getFullPlaylist("sp-pl-1");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().items).toHaveLength(1);
    });

    it("should return error on HTTP failure", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(null, false, 404));

      const result = await repo.getFullPlaylist("nonexistent");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("NOT_FOUND");
    });
  });

  describe("addPlaylist", () => {
    it("should create playlist with two-step fetch", async () => {
      const user = {
        id: "user1",
        display_name: "User 1",
        external_urls: { spotify: "https://open.spotify.com/user/user1" },
      };
      const newPlaylist = createSpotifyPlaylist({ id: "new-pl", name: "New" });

      mockFetch
        .mockResolvedValueOnce(mockResponse(user))
        .mockResolvedValueOnce(mockResponse(newPlaylist));

      const result = await repo.addPlaylist("New", PlaylistPrivacy.Public);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().id).toBe("new-pl");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should fetch /me endpoint first to get userId", async () => {
      const user = {
        id: "myUserId",
        display_name: "Me",
        external_urls: { spotify: "https://open.spotify.com/user/myUserId" },
      };
      mockFetch
        .mockResolvedValueOnce(mockResponse(user))
        .mockResolvedValueOnce(mockResponse(createSpotifyPlaylist()));

      await repo.addPlaylist("Playlist", PlaylistPrivacy.Private);

      // First call is /me
      const meUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(meUrl.pathname).toBe("/v1/me");

      // Second call is POST to /users/{userId}/playlists
      const createUrl = new URL(mockFetch.mock.calls[1][0]);
      expect(createUrl.pathname).toBe("/v1/users/myUserId/playlists");
      const options = mockFetch.mock.calls[1][1];
      expect(options.method).toBe("POST");
      const body = JSON.parse(options.body);
      expect(body.name).toBe("Playlist");
      expect(body.public).toBe(false);
    });

    it("should return error when /me fails", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(null, false, 401));

      const result = await repo.addPlaylist("Test", PlaylistPrivacy.Public);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("UNAUTHORIZED");
    });
  });

  describe("addPlaylistItem", () => {
    it("should add item and return snapshot-based response", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ snapshot_id: "snap123" }));

      const result = await repo.addPlaylistItem("pl1", "track123");

      expect(result.isOk()).toBe(true);
      const item = result._unsafeUnwrap();
      expect(item.id).toBe("snap123");
      expect(item.videoId).toBe("track123");
      expect(item.url).toBe("https://open.spotify.com/track/track123");
    });

    it("should send correct request body with track URI", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ snapshot_id: "snap" }));

      await repo.addPlaylistItem("pl1", "track123");

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.pathname).toBe("/v1/playlists/pl1/tracks");
      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe("POST");
      const body = JSON.parse(options.body);
      expect(body.uris).toEqual(["spotify:track:track123"]);
    });

    it("should return error on HTTP failure", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(null, false, 403));

      const result = await repo.addPlaylistItem("pl1", "track1");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("FORBIDDEN");
    });
  });

  describe("removePlaylistItem", () => {
    it("should remove item successfully", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await repo.removePlaylistItem("track1", "pl1");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it("should send DELETE request with track URI", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await repo.removePlaylistItem("track1", "pl1");

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.pathname).toBe("/v1/playlists/pl1/tracks");
      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe("DELETE");
      const body = JSON.parse(options.body);
      expect(body.tracks).toEqual([{ uri: "spotify:track:track1" }]);
    });

    it("should return error on HTTP failure", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      const result = await repo.removePlaylistItem("track1", "pl1");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("NOT_FOUND");
    });
  });

  describe("updatePlaylistItemPosition", () => {
    it("should reorder item by fetching playlist first", async () => {
      const tracks = [
        createSpotifyTrack({ id: "t1" }),
        createSpotifyTrack({ id: "t2" }),
        createSpotifyTrack({ id: "t3" }),
      ];
      const playlist = createSpotifyFullPlaylist({
        tracks: {
          href: "https://api.spotify.com/v1/playlists/pl1/tracks",
          total: 3,
          items: tracks,
          next: null,
          previous: null,
          limit: 100,
          offset: 0,
        },
      });

      mockFetch
        .mockResolvedValueOnce(mockResponse(playlist)) // getFullPlaylist
        .mockResolvedValueOnce(mockResponse({ snapshot_id: "snap" })); // PUT reorder

      const result = await repo.updatePlaylistItemPosition(
        "t2",
        "pl1",
        "t2",
        0,
      );

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().position).toBe(0);
    });

    it("should send PUT with correct range_start and insert_before", async () => {
      const tracks = [
        createSpotifyTrack({ id: "t1" }),
        createSpotifyTrack({ id: "t2" }),
        createSpotifyTrack({ id: "t3" }),
      ];
      const playlist = createSpotifyFullPlaylist({
        tracks: {
          href: "https://api.spotify.com/v1/playlists/pl1/tracks",
          total: 3,
          items: tracks,
          next: null,
          previous: null,
          limit: 100,
          offset: 0,
        },
      });

      mockFetch
        .mockResolvedValueOnce(mockResponse(playlist))
        .mockResolvedValueOnce(mockResponse({ snapshot_id: "snap" }));

      // Move t1 (position 0) to position 2
      await repo.updatePlaylistItemPosition("t1", "pl1", "t1", 2);

      // The PUT call is the last one
      const putCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const body = JSON.parse(putCall[1].body);
      expect(body.range_start).toBe(0);
      expect(body.insert_before).toBe(3); // position > currentPosition: position + 1
      expect(body.range_length).toBe(1);
    });

    it("should return NOT_FOUND when item is not in playlist", async () => {
      const playlist = createSpotifyFullPlaylist({
        tracks: {
          href: "https://api.spotify.com/v1/playlists/pl1/tracks",
          total: 1,
          items: [createSpotifyTrack({ id: "t1" })],
          next: null,
          previous: null,
          limit: 100,
          offset: 0,
        },
      });

      mockFetch.mockResolvedValueOnce(mockResponse(playlist));

      const result = await repo.updatePlaylistItemPosition(
        "nonexistent",
        "pl1",
        "nonexistent",
        0,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("NOT_FOUND");
    });
  });

  describe("deletePlaylist", () => {
    it("should delete playlist via /followers endpoint", async () => {
      const playlist = createSpotifyFullPlaylist({
        id: "pl1",
        name: "To Delete",
      });
      mockFetch
        .mockResolvedValueOnce(mockResponse(playlist))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await repo.deletePlaylist("pl1");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().id).toBe("pl1");
      expect(result._unsafeUnwrap().title).toBe("To Delete");
    });

    it("should send DELETE to /followers endpoint", async () => {
      const playlist = createSpotifyFullPlaylist({ id: "pl1" });
      mockFetch
        .mockResolvedValueOnce(mockResponse(playlist))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      await repo.deletePlaylist("pl1");

      const deleteUrl = new URL(mockFetch.mock.calls[1][0]);
      expect(deleteUrl.pathname).toBe("/v1/playlists/pl1/followers");
      expect(mockFetch.mock.calls[1][1].method).toBe("DELETE");
    });

    it("should return error when playlist fetch fails", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(null, false, 404));

      const result = await repo.deletePlaylist("nonexistent");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("NOT_FOUND");
    });

    it("should return error when delete request fails", async () => {
      const playlist = createSpotifyFullPlaylist();
      mockFetch
        .mockResolvedValueOnce(mockResponse(playlist))
        .mockResolvedValueOnce({ ok: false, status: 403 });

      const result = await repo.deletePlaylist("sp-pl-1");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("FORBIDDEN");
    });
  });
});
