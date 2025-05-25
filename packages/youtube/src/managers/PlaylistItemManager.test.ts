import { describe, expect, it, vi } from "vitest";

import { Page } from "../Page";
import { PlaylistItem } from "../structures/PlaylistItem";
import { PlaylistItemManager } from "./PlaylistItemManager";

describe("PlaylistItemManager", () => {
  const mockSDKClient = {
    playlistItems: {
      list: vi.fn(),
    },
  };

  function makeItem(id: number) {
    return {
      id,
      contentDetails: { itemCount: 10 },
      snippet: {
        title: `Item ${id}`,
        description: `Description for item ${id}`,
        position: id,
        videoOwnerChannelTitle: `Channel ${id}`,
        resourceId: {
          videoId: `video${id}`,
        },
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

  mockSDKClient.playlistItems.list.mockResolvedValue({
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

  const manager = new PlaylistItemManager(mockClient);

  it("should call playlistItems.list with correct parameters", async () => {
    await manager.getByPlaylistId("playlist123", "token456");

    expect(mockSDKClient.playlistItems.list).toHaveBeenCalledWith({
      part: ["id", "contentDetails", "snippet"],
      playlistId: "playlist123",
      maxResults: 50,
      pageToken: "token456",
    });
  });

  it("should return a Page with PlaylistItem instances", async () => {
    const page = await manager.getByPlaylistId("playlist123");

    expect(page).toBeInstanceOf(Page);
    expect(page.data[0]).toBeInstanceOf(PlaylistItem);
    expect(page.resultsPerPage).toBe(10);
    expect(page.totalResults).toBe(100);
  });

  it("should throw if required properties are missing", async () => {
    mockSDKClient.playlistItems.list.mockResolvedValue({
      data: {},
    });

    await expect(manager.getByPlaylistId("playlist123")).rejects.toThrowError();
  });
});
