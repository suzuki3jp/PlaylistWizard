import { describe, expect, it } from "vitest";
import { Provider } from "@/entities/provider";
import type { PlaylistResource } from "./schemas/playlist";
import type { PlaylistItemResource } from "./schemas/playlist-item";
import type { VideoDetailResource } from "./schemas/video-detail";
import {
  toVideoSearchResult,
  transformPlaylist,
  transformPlaylistItem,
} from "./transformers";

function createMockPlaylistResource(
  overrides?: Partial<PlaylistResource>,
): PlaylistResource {
  return {
    kind: "youtube#playlist",
    id: "PLtest123",
    snippet: {
      title: "Test Playlist",
      thumbnails: {
        default: {
          url: "https://i.ytimg.com/vi/abc/default.jpg",
          width: 120,
          height: 90,
        },
        medium: {
          url: "https://i.ytimg.com/vi/abc/mqdefault.jpg",
          width: 320,
          height: 180,
        },
        high: {
          url: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
          width: 480,
          height: 360,
        },
      },
    },
    contentDetails: {
      itemCount: 10,
    },
    ...overrides,
  };
}

function createMockPlaylistItemResource(
  overrides?: Partial<PlaylistItemResource>,
): PlaylistItemResource {
  return {
    kind: "youtube#playlistItem",
    id: "UExitem123",
    snippet: {
      playlistId: "PLtest123",
      title: "Test Video",
      position: 0,
      thumbnails: {
        default: {
          url: "https://i.ytimg.com/vi/vid1/default.jpg",
          width: 120,
          height: 90,
        },
        medium: {
          url: "https://i.ytimg.com/vi/vid1/mqdefault.jpg",
          width: 320,
          height: 180,
        },
        high: {
          url: "https://i.ytimg.com/vi/vid1/hqdefault.jpg",
          width: 480,
          height: 360,
        },
      },
      channelTitle: "Test Channel",
      resourceId: {
        kind: "youtube#video",
        videoId: "vid1",
      },
    },
    contentDetails: {
      videoId: "vid1",
    },
    ...overrides,
  };
}

describe("transformPlaylist", () => {
  it("should map all fields correctly", () => {
    const resource = createMockPlaylistResource();
    const result = transformPlaylist(resource);

    expect(result).toEqual({
      id: "PLtest123",
      title: "Test Playlist",
      thumbnailUrl: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
      itemsTotal: 10,
      url: "https://www.youtube.com/playlist?list=PLtest123",
      provider: Provider.GOOGLE,
    });
  });

  it("should select the largest thumbnail", () => {
    const resource = createMockPlaylistResource({
      snippet: {
        title: "Test",
        thumbnails: {
          default: {
            url: "https://i.ytimg.com/vi/abc/default.jpg",
            width: 120,
            height: 90,
          },
          maxres: {
            url: "https://i.ytimg.com/vi/abc/maxresdefault.jpg",
            width: 1280,
            height: 720,
          },
        },
      },
    });
    const result = transformPlaylist(resource);
    expect(result.thumbnailUrl).toBe(
      "https://i.ytimg.com/vi/abc/maxresdefault.jpg",
    );
  });

  it("should generate correct URL", () => {
    const resource = createMockPlaylistResource({ id: "PLmyPlaylist" });
    const result = transformPlaylist(resource);
    expect(result.url).toBe(
      "https://www.youtube.com/playlist?list=PLmyPlaylist",
    );
  });

  it("should set provider to Provider.GOOGLE", () => {
    const result = transformPlaylist(createMockPlaylistResource());
    expect(result.provider).toBe(Provider.GOOGLE);
  });
});

describe("transformPlaylistItem", () => {
  it("should map all fields correctly", () => {
    const resource = createMockPlaylistItemResource();
    const result = transformPlaylistItem(resource);

    expect(result).toEqual({
      id: "UExitem123",
      title: "Test Video",
      thumbnailUrl: "https://i.ytimg.com/vi/vid1/default.jpg",
      position: 0,
      author: "Test Channel",
      videoId: "vid1",
      url: "https://www.youtube.com/watch?v=vid1",
    });
  });

  it("should select the smallest thumbnail", () => {
    const resource = createMockPlaylistItemResource({
      snippet: {
        playlistId: "PLtest123",
        title: "Test Video",
        position: 0,
        thumbnails: {
          default: {
            url: "https://i.ytimg.com/vi/vid1/default.jpg",
            width: 120,
            height: 90,
          },
          maxres: {
            url: "https://i.ytimg.com/vi/vid1/maxresdefault.jpg",
            width: 1280,
            height: 720,
          },
        },
        channelTitle: "Test Channel",
        resourceId: { kind: "youtube#video", videoId: "vid1" },
      },
      contentDetails: { videoId: "vid1" },
    });
    const result = transformPlaylistItem(resource);
    expect(result.thumbnailUrl).toBe("https://i.ytimg.com/vi/vid1/default.jpg");
  });

  it("should generate correct URL from videoId", () => {
    const resource = createMockPlaylistItemResource({
      contentDetails: { videoId: "myVideoId" },
      snippet: {
        playlistId: "PLtest123",
        title: "Test",
        position: 0,
        thumbnails: {},
        channelTitle: "Channel",
        resourceId: { kind: "youtube#video", videoId: "myVideoId" },
      },
    });
    const result = transformPlaylistItem(resource);
    expect(result.url).toBe("https://www.youtube.com/watch?v=myVideoId");
  });
});

describe("toVideoSearchResult", () => {
  function createMockVideoDetailResource(
    overrides?: Partial<VideoDetailResource>,
  ): VideoDetailResource {
    return {
      kind: "youtube#video",
      id: "vid1",
      snippet: {
        title: "Test Video",
        channelTitle: "Test Channel",
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
        duration: "PT3M45S",
      },
      statistics: {
        viewCount: "12345",
      },
      ...overrides,
    };
  }

  it("should map all fields correctly", () => {
    const resource = createMockVideoDetailResource();
    const result = toVideoSearchResult(resource);

    expect(result).toEqual({
      id: "vid1",
      title: "Test Video",
      channelTitle: "Test Channel",
      thumbnailUrl: "https://i.ytimg.com/vi/vid1/default.jpg",
      duration: "PT3M45S",
      viewCount: "12345",
      publishedAt: "2024-01-01T00:00:00Z",
    });
  });

  it("should default viewCount to '0' when missing", () => {
    const resource = createMockVideoDetailResource({
      statistics: { viewCount: undefined },
    });
    const result = toVideoSearchResult(resource);
    expect(result.viewCount).toBe("0");
  });
});

describe("thumbnail extraction edge cases", () => {
  it("should skip thumbnails with no_thumbnail.jpg suffix", () => {
    const resource = createMockPlaylistResource({
      snippet: {
        title: "Test",
        thumbnails: {
          default: {
            url: "https://i.ytimg.com/img/no_thumbnail.jpg",
            width: 120,
            height: 90,
          },
          medium: {
            url: "https://i.ytimg.com/vi/abc/mqdefault.jpg",
            width: 320,
            height: 180,
          },
        },
      },
    });
    const result = transformPlaylist(resource);
    expect(result.thumbnailUrl).toBe(
      "https://i.ytimg.com/vi/abc/mqdefault.jpg",
    );
  });

  it("should return default thumbnail URL when all thumbnails are undefined", () => {
    const resource = createMockPlaylistResource({
      snippet: {
        title: "Test",
        thumbnails: {},
      },
    });
    const result = transformPlaylist(resource);
    expect(result.thumbnailUrl).toBe(
      "https://i.ytimg.com/img/no_thumbnail.jpg",
    );
  });

  it("should return default thumbnail when all thumbnails have no_thumbnail.jpg suffix", () => {
    const resource = createMockPlaylistResource({
      snippet: {
        title: "Test",
        thumbnails: {
          default: { url: "https://i.ytimg.com/img/no_thumbnail.jpg" },
          medium: { url: "https://i.ytimg.com/vi/abc/no_thumbnail.jpg" },
        },
      },
    });
    const result = transformPlaylist(resource);
    expect(result.thumbnailUrl).toBe(
      "https://i.ytimg.com/img/no_thumbnail.jpg",
    );
  });
});
