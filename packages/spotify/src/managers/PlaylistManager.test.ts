import { describe, expect, it, vi } from "vitest";

import { IPage, Page, type RawPage } from "../Page";
import { Playlist, type RawPlaylist } from "../structures/Playlist";
import { PlaylistManager } from "./PlaylistManager";

describe("PlaylistManager", () => {
  const mockClient = {
    fetch: vi.fn(),
  };
  const playlistManager = new PlaylistManager(mockClient);

  describe("getMine", () => {
    it("should fetch and return a page of playlists", async () => {
      const mockRawPlaylist: RawPlaylist = {
        id: "123",
        name: "My Playlist",
        description: "A test playlist",
        images: [],
        owner: {
          id: "owner123",
          display_name: "Owner Name",
          external_urls: {
            spotify: "https://open.spotify.com/user/owner123",
          },
          href: "https://api.spotify.com/v1/users/owner123",
          type: "user",
          uri: "spotify:user:owner123",
        },
        external_urls: {
          spotify: "https://open.spotify.com/playlist/123",
        },
        href: "https://api.spotify.com/v1/playlists/123",
        tracks: {
          href: "https://api.spotify.com/v1/playlists/123/tracks",
          total: 10,
        },
        type: "playlist",
        uri: "spotify:playlist:123",
        collaborative: false,
        public: true,
        snapshot_id: "MTY3NjQyMjE5MiwwMDAwMDAwMGQ0MWQ4Y2Q5",
      };

      const mockResponse: RawPage<RawPlaylist> = {
        items: [mockRawPlaylist],
        limit: 50,
        offset: 0,
        total: 1,
        href: "https://api.spotify.com/v1/me/playlists",
        next: null,
        previous: null,
      };

      mockClient.fetch.mockResolvedValue(mockResponse);

      const result = await playlistManager.getMine();

      expect(mockClient.fetch).toHaveBeenCalledWith("/me/playlists", {
        method: "GET",
        params: {
          limit: "50",
        },
      });

      expect(result).toBeInstanceOf(Page);
      expect(result.items[0]).toBeInstanceOf(Playlist);
      expect(result.items[0].id).toBe("123");
      expect(result.items[0].name).toBe("My Playlist");
    });
  });

  describe("unfollow", () => {
    it("should call the correct endpoint to unfollow a playlist", async () => {
      mockClient.fetch.mockResolvedValue(undefined);

      await playlistManager.unfollow("playlist123");

      expect(mockClient.fetch).toHaveBeenCalledWith(
        "/playlists/playlist123/followers",
        {
          method: "DELETE",
        },
        true,
      );
    });
  });
});
