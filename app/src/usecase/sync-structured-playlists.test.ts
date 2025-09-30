import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import { err, ok, type Result } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FullPlaylist, PlaylistItem } from "@/features/playlist/entities";
import type { Failure } from "./actions/plain-result";
import { AddPlaylistItemUsecase } from "./add-playlist-item";
import { FetchFullPlaylistUsecase } from "./fetch-full-playlist";
import {
  type SyncError,
  SyncStructuredPlaylistsUsecase,
} from "./sync-structured-playlists";

// Mock the dependencies
vi.mock("./fetch-full-playlist");
vi.mock("./add-playlist-item");

describe("SyncStructuredPlaylistsUsecase", () => {
  const mockDefinitionJson: StructuredPlaylistsDefinition = {
    version: 1,
    name: "test",
    provider: "google",
    playlists: [],
  };

  const mockOptions = {
    accessToken: "test-token",
    repository: "google" as const,
    definitionJson: mockDefinitionJson,
  };

  const mockPlaylistItem = PlaylistItem.parse({
    id: "item1",
    title: "Test Item",
    thumbnailUrl: "https://example.com/thumb.jpg",
    position: 0,
    author: "Test Author",
    videoId: "video1",
    url: "https://example.com/video1",
  });

  const mockPlaylist1 = FullPlaylist.parse({
    id: "playlist1",
    title: "Main Playlist",
    thumbnailUrl: "https://example.com/thumb1.jpg",
    itemsTotal: 0,
    url: "https://example.com/playlist1",
    items: [],
  });

  const mockPlaylist2 = FullPlaylist.parse({
    id: "playlist2",
    title: "Source Playlist",
    thumbnailUrl: "https://example.com/thumb2.jpg",
    itemsTotal: 1,
    url: "https://example.com/playlist2",
    items: [mockPlaylistItem],
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks for constructor calls
    vi.mocked(FetchFullPlaylistUsecase).mockImplementation(
      () =>
        ({
          execute: vi
            .fn()
            .mockResolvedValue(ok(FullPlaylist.parse(mockPlaylist1))),
        }) as unknown as FetchFullPlaylistUsecase,
    );

    vi.mocked(AddPlaylistItemUsecase).mockImplementation(
      () =>
        ({
          execute: vi
            .fn()
            .mockResolvedValue(ok(PlaylistItem.parse(mockPlaylistItem))),
        }) as unknown as AddPlaylistItemUsecase,
    );
  });

  describe("execute", () => {
    it("should successfully sync structured playlists", async () => {
      const definitionWithPlaylists: StructuredPlaylistsDefinition = {
        ...mockDefinitionJson,
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              {
                id: "playlist2",
              },
            ],
          },
        ],
      };

      // Setup specific mocks for this test
      const mockFetchExecute = vi
        .fn()
        .mockResolvedValueOnce(ok(FullPlaylist.parse(mockPlaylist1)))
        .mockResolvedValueOnce(ok(FullPlaylist.parse(mockPlaylist2)));

      const mockAddExecute = vi
        .fn()
        .mockResolvedValue(ok(PlaylistItem.parse(mockPlaylistItem)));

      vi.mocked(FetchFullPlaylistUsecase).mockImplementation(
        () =>
          ({
            execute: mockFetchExecute,
          }) as unknown as FetchFullPlaylistUsecase,
      );

      vi.mocked(AddPlaylistItemUsecase).mockImplementation(
        () =>
          ({
            execute: mockAddExecute,
          }) as unknown as AddPlaylistItemUsecase,
      );

      const callbacks = {
        onFetchedPlaylist: vi.fn(),
        onPlannedSyncSteps: vi.fn(),
        onCalculatedQuota: vi.fn(),
        onExecutingSyncStep: vi.fn(),
        onExecutedSyncStep: vi.fn(),
        onGeneratedReport: vi.fn(),
      };

      const usecase = new SyncStructuredPlaylistsUsecase({
        ...mockOptions,
        definitionJson: definitionWithPlaylists,
        ...callbacks,
      });

      const result = await usecase.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.totalSteps).toBe(1);
        expect(result.value.successfulSteps).toBe(1);
        expect(result.value.failedSteps).toBe(0);
        expect(result.value.quotaUsed).toBe(50); // 1 step * 50 quota per step
        expect(result.value.errors).toHaveLength(0);
      }

      // Verify callbacks were called
      expect(callbacks.onFetchedPlaylist).toHaveBeenCalledTimes(2);
      expect(callbacks.onPlannedSyncSteps).toHaveBeenCalled();
      expect(callbacks.onCalculatedQuota).toHaveBeenCalledWith(50); // 1 step * 50 quota per step
      expect(callbacks.onExecutingSyncStep).toHaveBeenCalled();
      expect(callbacks.onExecutedSyncStep).toHaveBeenCalled();
      expect(callbacks.onGeneratedReport).toHaveBeenCalled();
    });

    it("should handle fetch errors", async () => {
      const definitionWithPlaylists: StructuredPlaylistsDefinition = {
        ...mockDefinitionJson,
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              {
                id: "playlist2",
              },
            ],
          },
        ],
      };

      // Mock to return successful first playlist, then error for second
      const mockFetchExecute = vi
        .fn()
        .mockResolvedValueOnce(ok(FullPlaylist.parse(mockPlaylist1)))
        .mockResolvedValueOnce(err({ status: 404 } as Failure));

      vi.mocked(FetchFullPlaylistUsecase).mockImplementation(
        () =>
          ({
            execute: mockFetchExecute,
          }) as unknown as FetchFullPlaylistUsecase,
      );

      const usecase = new SyncStructuredPlaylistsUsecase({
        ...mockOptions,
        definitionJson: definitionWithPlaylists,
      });
      const result = await usecase.execute();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error as SyncError;
        expect(error.type).toBe("fetch_error");
        expect(error.message).toContain("Failed to fetch");
      }
    });

    it("should handle quota exceeded", async () => {
      // Create a definition with many items to exceed quota (10k / 50 = 200 max items)
      const largeDefinition: StructuredPlaylistsDefinition = {
        ...mockDefinitionJson,
        playlists: Array(250)
          .fill(0)
          .map((_, i) => ({
            id: `target${i}`,
            dependencies: [{ id: `source${i}` }],
          })),
      };

      // Create playlists with items that will exceed quota
      const targetPlaylist: FullPlaylist = {
        ...mockPlaylist1,
        items: [], // Empty target
      };

      const sourcePlaylist: FullPlaylist = {
        ...mockPlaylist2,
        items: [mockPlaylistItem], // Source with one item
      };

      const mockFetchExecute = vi.fn().mockImplementation(async () => {
        // Return alternating target and source playlists
        const callCount = mockFetchExecute.mock.calls.length;
        if (callCount % 2 === 1) {
          return ok(FullPlaylist.parse(targetPlaylist));
        }
        return ok(FullPlaylist.parse(sourcePlaylist));
      });

      vi.mocked(FetchFullPlaylistUsecase).mockImplementation(
        () =>
          ({
            execute: mockFetchExecute,
          }) as unknown as FetchFullPlaylistUsecase,
      );

      const onQuotaExceeded = vi.fn();
      const usecase = new SyncStructuredPlaylistsUsecase({
        ...mockOptions,
        definitionJson: largeDefinition,
        onQuotaExceeded,
      });

      const result = await usecase.execute();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error as SyncError;
        expect(error.type).toBe("quota_exceeded");
        expect(error.message).toContain("exceeds limit");
      }
      expect(onQuotaExceeded).toHaveBeenCalled();
    });

    it("should handle execution errors gracefully", async () => {
      const definitionWithPlaylists: StructuredPlaylistsDefinition = {
        ...mockDefinitionJson,
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              {
                id: "playlist2",
              },
            ],
          },
        ],
      };

      const mockFetchExecute = vi
        .fn()
        .mockResolvedValueOnce(ok(FullPlaylist.parse(mockPlaylist1)))
        .mockResolvedValueOnce(ok(FullPlaylist.parse(mockPlaylist2)));

      const mockAddExecute = vi
        .fn()
        .mockResolvedValueOnce(err({ status: 409 } as Failure));

      vi.mocked(FetchFullPlaylistUsecase).mockImplementation(
        () =>
          ({
            execute: mockFetchExecute,
          }) as unknown as FetchFullPlaylistUsecase,
      );

      vi.mocked(AddPlaylistItemUsecase).mockImplementation(
        () =>
          ({
            execute: mockAddExecute,
          }) as unknown as AddPlaylistItemUsecase,
      );

      const usecase = new SyncStructuredPlaylistsUsecase({
        ...mockOptions,
        definitionJson: definitionWithPlaylists,
      });
      const result = await usecase.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.totalSteps).toBe(1);
        expect(result.value.successfulSteps).toBe(0);
        expect(result.value.failedSteps).toBe(1);
        expect(result.value.errors).toHaveLength(1);
      }
    });

    it("should handle unknown errors", async () => {
      const invalidOptions = {
        ...mockOptions,
        definitionJson: null as unknown as StructuredPlaylistsDefinition,
      };

      const usecase = new SyncStructuredPlaylistsUsecase(invalidOptions);
      const result = await usecase.execute();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error as SyncError;
        expect(error.type).toBe("unknown_error");
      }
    });

    it("should skip items that already exist in target playlist", async () => {
      const definitionWithExistingItems: StructuredPlaylistsDefinition = {
        ...mockDefinitionJson,
        playlists: [
          {
            id: "playlist1",
            dependencies: [{ id: "playlist2" }],
          },
        ],
      };

      const playlistWithExistingItem: FullPlaylist = {
        ...mockPlaylist1,
        items: [mockPlaylistItem], // Already has the item
      };

      const mockFetchExecute = vi
        .fn()
        .mockResolvedValueOnce(ok(FullPlaylist.parse(playlistWithExistingItem)))
        .mockResolvedValueOnce(ok(FullPlaylist.parse(mockPlaylist2)));

      vi.mocked(FetchFullPlaylistUsecase).mockImplementation(
        () =>
          ({
            execute: mockFetchExecute,
          }) as unknown as FetchFullPlaylistUsecase,
      );

      const usecase = new SyncStructuredPlaylistsUsecase({
        ...mockOptions,
        definitionJson: definitionWithExistingItems,
      });
      const result = await usecase.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should have 0 steps because item already exists
        expect(result.value.totalSteps).toBe(0);
        expect(result.value.successfulSteps).toBe(0);
        expect(result.value.quotaUsed).toBe(0);
      }
    });
  });

  describe("getAllPlaylistIds", () => {
    it("should collect all playlist IDs recursively", () => {
      const nestedPlaylists = [
        {
          id: "playlist1",
          dependencies: [
            {
              id: "playlist2",
              dependencies: [{ id: "playlist3" }],
            },
            { id: "playlist4" },
          ],
        },
        { id: "playlist5" },
      ];

      const usecase = new SyncStructuredPlaylistsUsecase(mockOptions);
      // Access private method for testing using type assertion
      const getAllPlaylistIds = (
        usecase as unknown as {
          getAllPlaylistIds: (playlists: typeof nestedPlaylists) => string[];
        }
      ).getAllPlaylistIds.bind(usecase);
      const ids = getAllPlaylistIds(nestedPlaylists);

      expect(ids).toHaveLength(5);
      expect(ids).toContain("playlist1");
      expect(ids).toContain("playlist2");
      expect(ids).toContain("playlist3");
      expect(ids).toContain("playlist4");
      expect(ids).toContain("playlist5");
    });

    it("should handle duplicate IDs", () => {
      const playlistsWithDuplicates = [
        {
          id: "playlist1",
          dependencies: [{ id: "playlist2" }],
        },
        {
          id: "playlist1", // Duplicate
          dependencies: [{ id: "playlist2" }], // Duplicate dependency
        },
      ];

      const usecase = new SyncStructuredPlaylistsUsecase(mockOptions);
      const getAllPlaylistIds = (
        usecase as unknown as {
          getAllPlaylistIds: (
            playlists: typeof playlistsWithDuplicates,
          ) => string[];
        }
      ).getAllPlaylistIds.bind(usecase);
      const ids = getAllPlaylistIds(playlistsWithDuplicates);

      expect(ids).toHaveLength(2);
      expect(ids).toContain("playlist1");
      expect(ids).toContain("playlist2");
    });
  });

  describe("planSyncSteps", () => {
    it("should create sync steps for adding items from dependencies", () => {
      const playlists = [
        {
          id: "playlist1",
          dependencies: [{ id: "playlist2" }],
        },
      ];

      const playlistsMap = new Map([
        ["playlist1", mockPlaylist1],
        ["playlist2", mockPlaylist2],
      ]);

      const usecase = new SyncStructuredPlaylistsUsecase(mockOptions);
      const planSyncSteps = (
        usecase as unknown as {
          planSyncSteps: (
            playlists: Array<{
              id: string;
              dependencies?: Array<{ id: string }>;
            }>,
            playlistsMap: Map<string, FullPlaylist>,
          ) => Result<unknown[], SyncError>;
        }
      ).planSyncSteps.bind(usecase);
      const result = planSyncSteps(playlists, playlistsMap) as Result<
        unknown[],
        SyncError
      >;

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const steps = result.value;
        expect(steps).toHaveLength(1);
        expect(steps[0]).toEqual({
          type: "add_item",
          playlistId: "playlist1",
          item: mockPlaylistItem,
          sourcePlaylistId: "playlist2",
        });
      }
    });

    it("should handle multiple dependencies", () => {
      const itemFromPlaylist3: PlaylistItem = {
        ...mockPlaylistItem,
        id: "item3",
        videoId: "video3",
      };

      const mockPlaylist3: FullPlaylist = {
        ...mockPlaylist2,
        id: "playlist3",
        items: [itemFromPlaylist3],
      };

      const playlists = [
        {
          id: "playlist1",
          dependencies: [{ id: "playlist2" }, { id: "playlist3" }],
        },
      ];

      const playlistsMap = new Map([
        ["playlist1", mockPlaylist1],
        ["playlist2", mockPlaylist2],
        ["playlist3", mockPlaylist3],
      ]);

      const usecase = new SyncStructuredPlaylistsUsecase(mockOptions);
      const planSyncSteps = (
        usecase as unknown as {
          planSyncSteps: (
            playlists: Array<{
              id: string;
              dependencies?: Array<{ id: string }>;
            }>,
            playlistsMap: Map<string, FullPlaylist>,
          ) => Result<unknown[], SyncError>;
        }
      ).planSyncSteps.bind(usecase);
      const result = planSyncSteps(playlists, playlistsMap) as Result<
        unknown[],
        SyncError
      >;

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const steps = result.value as unknown[];
        expect(steps).toHaveLength(2);
        expect(
          (steps[0] as { sourcePlaylistId: string }).sourcePlaylistId,
        ).toBe("playlist2");
        expect(
          (steps[1] as { sourcePlaylistId: string }).sourcePlaylistId,
        ).toBe("playlist3");
      }
    });

    it("should skip steps for missing playlists", () => {
      const playlists = [
        {
          id: "playlist1",
          dependencies: [{ id: "missing-playlist" }],
        },
      ];

      const playlistsMap = new Map([
        ["playlist1", mockPlaylist1],
        // missing-playlist is not in the map
      ]);

      const usecase = new SyncStructuredPlaylistsUsecase(mockOptions);
      const planSyncSteps = (
        usecase as unknown as {
          planSyncSteps: (
            playlists: Array<{
              id: string;
              dependencies?: Array<{ id: string }>;
            }>,
            playlistsMap: Map<string, FullPlaylist>,
          ) => Result<unknown[], SyncError>;
        }
      ).planSyncSteps.bind(usecase);
      const result = planSyncSteps(playlists, playlistsMap) as Result<
        unknown[],
        SyncError
      >;

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const steps = result.value;
        expect(steps).toHaveLength(0);
      }
    });
  });
});
