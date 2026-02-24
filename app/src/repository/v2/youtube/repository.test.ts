import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlaylistPrivacy } from "@/features/playlist/entities";
import { YouTubeRepository } from "./repository";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(data: unknown, ok = true, status = 200) {
  return { ok, status, json: () => Promise.resolve(data) };
}

function createPlaylistResource(overrides?: Record<string, unknown>) {
  return {
    kind: "youtube#playlist",
    id: overrides?.id ?? "PLtest123",
    snippet: {
      title: overrides?.title ?? "Test Playlist",
      thumbnails: {
        default: {
          url: "https://i.ytimg.com/vi/abc/default.jpg",
          width: 120,
          height: 90,
        },
      },
    },
    contentDetails: {
      itemCount: overrides?.itemCount ?? 5,
    },
  };
}

function createPlaylistItemResource(overrides?: Record<string, unknown>) {
  return {
    kind: "youtube#playlistItem",
    id: overrides?.id ?? "UExitem1",
    snippet: {
      playlistId: overrides?.playlistId ?? "PLtest123",
      title: overrides?.title ?? "Test Video",
      position: overrides?.position ?? 0,
      thumbnails: {
        default: {
          url: "https://i.ytimg.com/vi/vid1/default.jpg",
          width: 120,
          height: 90,
        },
      },
      channelTitle: "Test Channel",
      resourceId: {
        kind: "youtube#video",
        videoId: overrides?.videoId ?? "vid1",
      },
    },
    contentDetails: {
      videoId: overrides?.videoId ?? "vid1",
    },
  };
}

function createListResponse(items: unknown[], nextPageToken?: string) {
  return {
    kind: "youtube#playlistListResponse",
    etag: "etag123",
    pageInfo: { totalResults: items.length, resultsPerPage: 50 },
    items,
    ...(nextPageToken ? { nextPageToken } : {}),
  };
}

function createSearchResultResource(overrides?: Record<string, unknown>) {
  return {
    kind: "youtube#searchResult",
    id: {
      kind: "youtube#video",
      videoId: overrides?.videoId ?? "vid1",
    },
    snippet: {
      title: overrides?.title ?? "Test Video",
      channelTitle: overrides?.channelTitle ?? "Test Channel",
      publishedAt: "2024-01-01T00:00:00Z",
      thumbnails: {
        default: {
          url: "https://i.ytimg.com/vi/vid1/default.jpg",
          width: 120,
          height: 90,
        },
      },
    },
  };
}

function createVideoDetailResource(overrides?: Record<string, unknown>) {
  return {
    kind: "youtube#video",
    id: overrides?.id ?? "vid1",
    snippet: {
      title: overrides?.title ?? "Test Video",
      channelTitle: overrides?.channelTitle ?? "Test Channel",
      publishedAt: "2024-01-01T00:00:00Z",
      thumbnails: {
        default: {
          url: "https://i.ytimg.com/vi/vid1/default.jpg",
          width: 120,
          height: 90,
        },
      },
    },
    contentDetails: {
      duration: overrides?.duration ?? "PT3M45S",
    },
    statistics: {
      viewCount: overrides?.viewCount ?? "12345",
    },
  };
}

describe("YouTubeRepository", () => {
  let repo: YouTubeRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    repo = new YouTubeRepository("test-access-token");
  });

  describe("getMyPlaylists", () => {
    it("should return playlists on success", async () => {
      const playlists = [
        createPlaylistResource({ id: "PL1" }),
        createPlaylistResource({ id: "PL2" }),
      ];
      mockFetch.mockResolvedValueOnce(
        mockResponse(createListResponse(playlists)),
      );

      const result = await repo.getMyPlaylists();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(2);
      expect(result._unsafeUnwrap()[0].id).toBe("PL1");
      expect(result._unsafeUnwrap()[1].id).toBe("PL2");
    });

    it("should handle pagination with nextPageToken", async () => {
      const page1 = [createPlaylistResource({ id: "PL1" })];
      const page2 = [createPlaylistResource({ id: "PL2" })];

      mockFetch
        .mockResolvedValueOnce(
          mockResponse(createListResponse(page1, "token2")),
        )
        .mockResolvedValueOnce(mockResponse(createListResponse(page2)));

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
      mockFetch.mockResolvedValueOnce(mockResponse(createListResponse([])));

      await repo.getMyPlaylists();

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.origin + url.pathname).toBe(
        "https://www.googleapis.com/youtube/v3/playlists",
      );
      expect(url.searchParams.get("mine")).toBe("true");
      expect(url.searchParams.get("maxResults")).toBe("50");
      expect(url.searchParams.get("part")).toContain("snippet");

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers.Authorization).toBe("Bearer test-access-token");
    });
  });

  describe("getFullPlaylist", () => {
    it("should return full playlist with items", async () => {
      const playlist = createPlaylistResource({ id: "PL1" });
      const items = [
        createPlaylistItemResource({ id: "item1", videoId: "v1" }),
        createPlaylistItemResource({ id: "item2", videoId: "v2" }),
      ];

      mockFetch
        .mockResolvedValueOnce(mockResponse(createListResponse([playlist])))
        .mockResolvedValueOnce(mockResponse(createListResponse(items)));

      const result = await repo.getFullPlaylist("PL1");

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.id).toBe("PL1");
      expect(data.items).toHaveLength(2);
      expect(data.items[0].videoId).toBe("v1");
    });

    it("should return NOT_FOUND when playlist does not exist", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(createListResponse([])));

      const result = await repo.getFullPlaylist("nonexistent");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("NOT_FOUND");
    });

    it("should handle paginated playlist items", async () => {
      const playlist = createPlaylistResource({ id: "PL1" });
      const page1Items = [createPlaylistItemResource({ id: "item1" })];
      const page2Items = [createPlaylistItemResource({ id: "item2" })];

      mockFetch
        .mockResolvedValueOnce(mockResponse(createListResponse([playlist])))
        .mockResolvedValueOnce(
          mockResponse(createListResponse(page1Items, "nextToken")),
        )
        .mockResolvedValueOnce(mockResponse(createListResponse(page2Items)));

      const result = await repo.getFullPlaylist("PL1");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().items).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should return error when playlist fetch fails", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(null, false, 403));

      const result = await repo.getFullPlaylist("PL1");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("FORBIDDEN");
    });

    it("should return error when items fetch fails", async () => {
      const playlist = createPlaylistResource();
      mockFetch
        .mockResolvedValueOnce(mockResponse(createListResponse([playlist])))
        .mockResolvedValueOnce(mockResponse(null, false, 429));

      const result = await repo.getFullPlaylist("PLtest123");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("TOO_MANY_REQUESTS");
    });
  });

  describe("addPlaylist", () => {
    it("should create a playlist and return it", async () => {
      const created = createPlaylistResource({
        id: "PLnew",
        title: "New Playlist",
      });
      mockFetch.mockResolvedValueOnce(mockResponse(created));

      const result = await repo.addPlaylist(
        "New Playlist",
        PlaylistPrivacy.Public,
      );

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().id).toBe("PLnew");
      expect(result._unsafeUnwrap().title).toBe("New Playlist");
    });

    it("should send correct request body", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(createPlaylistResource()));

      await repo.addPlaylist("My Playlist", PlaylistPrivacy.Private);

      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe("POST");
      const body = JSON.parse(options.body);
      expect(body.snippet.title).toBe("My Playlist");
      expect(body.status.privacyStatus).toBe(PlaylistPrivacy.Private);
    });

    it("should return error on HTTP failure", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(null, false, 403));

      const result = await repo.addPlaylist("Test", PlaylistPrivacy.Public);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("FORBIDDEN");
    });
  });

  describe("addPlaylistItem", () => {
    it("should add item and return it", async () => {
      const item = createPlaylistItemResource({ id: "newItem", videoId: "v1" });
      mockFetch.mockResolvedValueOnce(mockResponse(item));

      const result = await repo.addPlaylistItem("PL1", "v1");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().videoId).toBe("v1");
    });

    it("should send correct request body", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse(createPlaylistItemResource()),
      );

      await repo.addPlaylistItem("PL1", "videoId123");

      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe("POST");
      const body = JSON.parse(options.body);
      expect(body.snippet.playlistId).toBe("PL1");
      expect(body.snippet.resourceId.videoId).toBe("videoId123");
      expect(body.snippet.resourceId.kind).toBe("youtube#video");
    });

    it("should return error on HTTP failure", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(null, false, 404));

      const result = await repo.addPlaylistItem("PL1", "v1");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("NOT_FOUND");
    });
  });

  describe("removePlaylistItem", () => {
    it("should remove item successfully", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await repo.removePlaylistItem("item1", "PL1");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it("should send DELETE request with correct params", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await repo.removePlaylistItem("item1", "PL1");

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.searchParams.get("id")).toBe("item1");
      expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
    });

    it("should return error on HTTP failure", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      const result = await repo.removePlaylistItem("item1", "PL1");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("NOT_FOUND");
    });
  });

  describe("updatePlaylistItemPosition", () => {
    it("should update position and return item", async () => {
      const item = createPlaylistItemResource({ id: "item1", videoId: "v1" });
      mockFetch.mockResolvedValueOnce(mockResponse(item));

      const result = await repo.updatePlaylistItemPosition(
        "item1",
        "PL1",
        "v1",
        3,
      );

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().videoId).toBe("v1");
    });

    it("should send PUT request with correct body", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse(createPlaylistItemResource()),
      );

      await repo.updatePlaylistItemPosition("item1", "PL1", "v1", 5);

      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe("PUT");
      const body = JSON.parse(options.body);
      expect(body.id).toBe("item1");
      expect(body.snippet.playlistId).toBe("PL1");
      expect(body.snippet.position).toBe(5);
      expect(body.snippet.resourceId.videoId).toBe("v1");
    });

    it("should return error on HTTP failure", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(null, false, 403));

      const result = await repo.updatePlaylistItemPosition(
        "item1",
        "PL1",
        "v1",
        0,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("FORBIDDEN");
    });
  });

  describe("deletePlaylist", () => {
    it("should delete playlist and return it", async () => {
      const playlist = createPlaylistResource({
        id: "PL1",
        title: "To Delete",
      });
      mockFetch
        .mockResolvedValueOnce(mockResponse(createListResponse([playlist])))
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await repo.deletePlaylist("PL1");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().id).toBe("PL1");
      expect(result._unsafeUnwrap().title).toBe("To Delete");
    });

    it("should return NOT_FOUND when playlist does not exist", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(createListResponse([])));

      const result = await repo.deletePlaylist("nonexistent");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("NOT_FOUND");
    });

    it("should return error when delete request fails", async () => {
      const playlist = createPlaylistResource();
      mockFetch
        .mockResolvedValueOnce(mockResponse(createListResponse([playlist])))
        .mockResolvedValueOnce({ ok: false, status: 403 });

      const result = await repo.deletePlaylist("PLtest123");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("FORBIDDEN");
    });

    it("should send DELETE request with correct params", async () => {
      const playlist = createPlaylistResource({ id: "PL1" });
      mockFetch
        .mockResolvedValueOnce(mockResponse(createListResponse([playlist])))
        .mockResolvedValueOnce({ ok: true, status: 204 });

      await repo.deletePlaylist("PL1");

      // Second call should be the DELETE
      const url = new URL(mockFetch.mock.calls[1][0]);
      expect(url.searchParams.get("id")).toBe("PL1");
      expect(mockFetch.mock.calls[1][1].method).toBe("DELETE");
    });
  });

  describe("searchVideos", () => {
    it("should return search results merged with video details", async () => {
      const searchItems = [
        createSearchResultResource({ videoId: "vid1", title: "Video 1" }),
      ];
      const detailItems = [
        createVideoDetailResource({ id: "vid1", title: "Video 1 Detail" }),
      ];

      mockFetch
        .mockResolvedValueOnce(mockResponse(createListResponse(searchItems)))
        .mockResolvedValueOnce(mockResponse(createListResponse(detailItems)));

      const result = await repo.searchVideos("test query");

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe("vid1");
      expect(data.items[0].title).toBe("Video 1 Detail");
      expect(data.items[0].duration).toBe("PT3M45S");
    });

    it("should return empty items when search returns no results", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(createListResponse([])));

      const result = await repo.searchVideos("empty query");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().items).toHaveLength(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should pass nextPageToken in result", async () => {
      const searchItems = [createSearchResultResource({ videoId: "vid1" })];
      const detailItems = [createVideoDetailResource({ id: "vid1" })];

      mockFetch
        .mockResolvedValueOnce(
          mockResponse(createListResponse(searchItems, "nextToken123")),
        )
        .mockResolvedValueOnce(mockResponse(createListResponse(detailItems)));

      const result = await repo.searchVideos("test");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().nextPageToken).toBe("nextToken123");
    });

    it("should pass videoCategoryId and pageToken as query params", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(createListResponse([])));

      await repo.searchVideos("music", {
        videoCategoryId: "10",
        pageToken: "page2",
        maxResults: 10,
      });

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.searchParams.get("videoCategoryId")).toBe("10");
      expect(url.searchParams.get("pageToken")).toBe("page2");
      expect(url.searchParams.get("maxResults")).toBe("10");
      expect(url.searchParams.get("q")).toBe("music");
    });

    it("should return error when search fetch fails", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(null, false, 401));

      const result = await repo.searchVideos("test");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("UNAUTHORIZED");
    });

    it("should return error when video details fetch fails", async () => {
      const searchItems = [createSearchResultResource({ videoId: "vid1" })];
      mockFetch
        .mockResolvedValueOnce(mockResponse(createListResponse(searchItems)))
        .mockResolvedValueOnce(mockResponse(null, false, 403));

      const result = await repo.searchVideos("test");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("FORBIDDEN");
    });
  });

  describe("getVideoDetails", () => {
    it("should return video details as VideoSearchResult", async () => {
      const details = [
        createVideoDetailResource({
          id: "vid1",
          title: "My Video",
          channelTitle: "My Channel",
          duration: "PT5M",
          viewCount: "99999",
        }),
      ];

      mockFetch.mockResolvedValueOnce(
        mockResponse(createListResponse(details)),
      );

      const result = await repo.getVideoDetails(["vid1"]);

      expect(result.isOk()).toBe(true);
      const items = result._unsafeUnwrap();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe("vid1");
      expect(items[0].title).toBe("My Video");
      expect(items[0].channelTitle).toBe("My Channel");
      expect(items[0].duration).toBe("PT5M");
      expect(items[0].viewCount).toBe("99999");
    });

    it("should send correct request with comma-separated IDs", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(createListResponse([])));

      await repo.getVideoDetails(["vid1", "vid2", "vid3"]);

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.searchParams.get("id")).toBe("vid1,vid2,vid3");
      expect(url.searchParams.get("part")).toContain("snippet");
      expect(url.searchParams.get("part")).toContain("contentDetails");
      expect(url.searchParams.get("part")).toContain("statistics");
    });

    it("should return VALIDATION_ERROR on invalid response", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ invalid: "data" }));

      const result = await repo.getVideoDetails(["vid1"]);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("VALIDATION_ERROR");
    });

    it("should return error on HTTP failure", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(null, false, 429));

      const result = await repo.getVideoDetails(["vid1"]);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().status).toBe("TOO_MANY_REQUESTS");
    });
  });
});
