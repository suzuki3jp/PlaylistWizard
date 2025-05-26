import { describe, expect, it, vi } from "vitest";
import { Page } from "../Page";
import { Playlist } from "../structures/Playlist";
import { PlaylistManager } from "./PlaylistManager";

describe("PlaylistManager#getMine", () => {
  const mockSDKClient = {
    playlists: {
      list: vi.fn(),
    },
  };

  function makeItem(id: number) {
    return {
      id,
      contentDetails: { itemCount: 10 },
      snippet: {
        title: `Playlist ${id}`,
        description: `Description for playlist ${id}`,
        thumbnails: {
          default: {
            url: `https://example.com/thumbnail${id}.jpg`,
            width: 120,
            height: 90,
          },
          medium: {
            url: `https://example.com/thumbnail${id}_medium.jpg`,
            width: 320,
            height: 180,
          },
          high: {
            url: `https://example.com/thumbnail${id}_high.jpg`,
            width: 480,
            height: 360,
          },
        },
      },
    };
  }

  mockSDKClient.playlists.list.mockResolvedValue({
    data: {
      items: Array.from({ length: 5 }, (_, i) => makeItem(i + 1)),
      prevPageToken: "prev",
      nextPageToken: "next",
      pageInfo: { resultsPerPage: 10, totalResults: 100 },
    },
  });

  const mockClient = {
    makeOfficialSDKClient: vi.fn(() => mockSDKClient),
  };

  const playlistManager = new PlaylistManager(mockClient);

  it("should call playlists.list with correct parameters", async () => {
    await playlistManager.getMine("testToken");

    expect(mockSDKClient.playlists.list).toHaveBeenCalledWith({
      part: ["id", "contentDetails", "snippet"],
      mine: true,
      maxResults: 50,
      pageToken: "testToken",
    });
  });

  it("should return a Page of Playlist instances", async () => {
    const page = await playlistManager.getMine();

    expect(page).toBeInstanceOf(Page);
    expect(page.data[0]).toBeInstanceOf(Playlist);
    expect(page.resultsPerPage).toBe(10);
    expect(page.totalResults).toBe(100);
  });

  it("should throw if items or pageInfo are missing", async () => {
    mockSDKClient.playlists.list.mockResolvedValue({
      data: {},
    });

    await expect(playlistManager.getMine()).rejects.toThrowError();
  });
});

describe("PlaylistManager#getById", () => {
  const mockSDKClient = {
    playlists: {
      list: vi.fn(),
    },
  };

  const mockClient = {
    makeOfficialSDKClient: vi.fn(() => mockSDKClient),
  };

  const playlistManager = new PlaylistManager(mockClient);

  it("should return a Playlist instance for a valid ID", async () => {
    const item = {
      id: "123",
      contentDetails: { itemCount: 10 },
      snippet: {
        title: "Test Playlist",
        description: "Description for test playlist",
        thumbnails: {
          default: {
            url: "https://example.com/thumbnail.jpg",
            width: 120,
            height: 90,
          },
          medium: {
            url: "https://example.com/thumbnail_medium.jpg",
            width: 320,
            height: 180,
          },
          high: {
            url: "https://example.com/thumbnail_high.jpg",
            width: 480,
            height: 360,
          },
        },
      },
    };

    mockSDKClient.playlists.list.mockResolvedValue({
      data: { items: [item] },
    });

    const playlist = await playlistManager.getById("123");

    expect(playlist).toBeInstanceOf(Playlist);
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    expect(playlist!.id).toBe("123");
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    expect(playlist!.title).toBe("Test Playlist");
  });

  it("should return null for an invalid ID", async () => {
    mockSDKClient.playlists.list.mockResolvedValue({
      data: { items: [] },
    });

    const playlist = await playlistManager.getById("invalid");

    expect(playlist).toBeNull();
  });
});

describe("PlaylistManager#create", () => {
  const mockSDKClient = {
    playlists: {
      insert: vi.fn(),
    },
  };

  const mockClient = {
    makeOfficialSDKClient: vi.fn(() => mockSDKClient),
  };

  const playlistManager = new PlaylistManager(mockClient);

  it("should create a playlist and return a Playlist instance", async () => {
    const item = {
      id: "123",
      contentDetails: { itemCount: 0 },
      snippet: {
        title: "New Playlist",
        description: "Description for new playlist",
        thumbnails: {
          default: {
            url: "https://example.com/thumbnail.jpg",
            width: 120,
            height: 90,
          },
          medium: {
            url: "https://example.com/thumbnail_medium.jpg",
            width: 320,
            height: 180,
          },
          high: {
            url: "https://example.com/thumbnail_high.jpg",
            width: 480,
            height: 360,
          },
        },
      },
    };

    mockSDKClient.playlists.insert.mockResolvedValue({
      data: item,
    });

    const playlist = await playlistManager.create({
      title: "New Playlist",
      privacy: "public",
    });

    expect(playlist).toBeInstanceOf(Playlist);
    expect(playlist.id).toBe("123");
    expect(playlist.title).toBe("New Playlist");
  });
});

describe("PlaylistManager#delete", () => {
  const mockSDKClient = {
    playlists: {
      delete: vi.fn(),
    },
  };

  const mockClient = {
    makeOfficialSDKClient: vi.fn(() => mockSDKClient),
  };

  const playlistManager = new PlaylistManager(mockClient);

  it("should delete a playlist and return the status code", async () => {
    mockSDKClient.playlists.delete.mockResolvedValue({
      status: 204,
    });

    const status = await playlistManager.delete("123");

    expect(status).toBe(204);
    expect(mockSDKClient.playlists.delete).toHaveBeenCalledWith({
      id: "123",
    });
  });
});
