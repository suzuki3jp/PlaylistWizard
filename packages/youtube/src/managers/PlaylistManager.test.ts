import { describe, expect, it, vi } from "vitest";
import { Page } from "../Page";
import { Playlist } from "../structures/Playlist";
import { PlaylistManager } from "./PlaylistManager";

describe("PlaylistManager", () => {
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
