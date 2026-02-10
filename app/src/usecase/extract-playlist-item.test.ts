import { beforeEach, describe, expect, it, vi } from "vitest";
import { callWithRetries } from "@/common/call-with-retries";
import { Provider } from "@/entities/provider";
import {
  createDummyPlaylistItem,
  type FullPlaylist,
} from "@/features/playlist/entities";
import { ExtractPlaylistItemUsecase } from "./extract-playlist-item";
import { FetchOrCreatePlaylistUsecase } from "./fetch-or-create-playlist";
import { shouldAddItem } from "./utils";

vi.mock("@/common/call-with-retries", () => ({
  callWithRetries: vi.fn(),
}));

vi.mock("./fetch-or-create-playlist", () => ({
  FetchOrCreatePlaylistUsecase: vi.fn(),
}));

vi.mock("./utils", () => ({
  shouldAddItem: vi.fn(),
}));

function createFullPlaylist(overrides?: Partial<FullPlaylist>): FullPlaylist {
  return {
    id: "target-playlist",
    title: "Target",
    thumbnailUrl: "https://example.com/img.jpg",
    itemsTotal: 0,
    url: "https://example.com/playlist",
    provider: Provider.GOOGLE,
    items: [],
    ...overrides,
  };
}

function mockFetchOrCreate(playlist: FullPlaylist) {
  vi.mocked(FetchOrCreatePlaylistUsecase).mockImplementation(
    () =>
      ({
        execute: vi
          .fn()
          .mockResolvedValue({ isErr: () => false, value: playlist }),
      }) as unknown as FetchOrCreatePlaylistUsecase,
  );
}

function mockFetchOrCreateError(status: number) {
  vi.mocked(FetchOrCreatePlaylistUsecase).mockImplementation(
    () =>
      ({
        execute: vi.fn().mockResolvedValue({
          isErr: () => true,
          error: { status },
        }),
      }) as unknown as FetchOrCreatePlaylistUsecase,
  );
}

describe("ExtractPlaylistItemUsecase", () => {
  const baseOptions = {
    accessToken: "test-token",
    repository: Provider.GOOGLE,
    sourceIds: ["source-1"],
    artistNames: ["Artist A"],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(shouldAddItem).mockReturnValue(true);
  });

  it("should filter items by artist name", async () => {
    const sourceItems = [
      createDummyPlaylistItem({ id: "1", videoId: "v1", author: "Artist A" }),
      createDummyPlaylistItem({ id: "2", videoId: "v2", author: "Artist B" }),
      createDummyPlaylistItem({ id: "3", videoId: "v3", author: "Artist A" }),
    ];

    vi.mocked(callWithRetries)
      .mockResolvedValueOnce({
        status: 200,
        data: createFullPlaylist({ id: "source-1", items: sourceItems }),
      })
      .mockResolvedValue({
        status: 200,
        data: createDummyPlaylistItem({}),
      });

    const targetPlaylist = createFullPlaylist();
    mockFetchOrCreate(targetPlaylist);

    const usecase = new ExtractPlaylistItemUsecase(baseOptions);
    const result = await usecase.execute();

    expect(result.isOk()).toBe(true);
    // callWithRetries: 1 (getFullPlaylist) + 2 (addPlaylistItem for Artist A items)
    expect(callWithRetries).toHaveBeenCalledTimes(3);
  });

  it("should merge items from multiple source playlists", async () => {
    const source1Items = [
      createDummyPlaylistItem({ id: "1", videoId: "v1", author: "Artist A" }),
    ];
    const source2Items = [
      createDummyPlaylistItem({ id: "2", videoId: "v2", author: "Artist A" }),
    ];

    vi.mocked(callWithRetries)
      .mockResolvedValueOnce({
        status: 200,
        data: createFullPlaylist({ id: "source-1", items: source1Items }),
      })
      .mockResolvedValueOnce({
        status: 200,
        data: createFullPlaylist({ id: "source-2", items: source2Items }),
      })
      .mockResolvedValue({
        status: 200,
        data: createDummyPlaylistItem({}),
      });

    const targetPlaylist = createFullPlaylist();
    mockFetchOrCreate(targetPlaylist);

    const usecase = new ExtractPlaylistItemUsecase({
      ...baseOptions,
      sourceIds: ["source-1", "source-2"],
    });
    const result = await usecase.execute();

    expect(result.isOk()).toBe(true);
    // 2 (getFullPlaylist) + 2 (addPlaylistItem)
    expect(callWithRetries).toHaveBeenCalledTimes(4);
  });

  it("should skip items when allowDuplicate=false and shouldAddItem returns false", async () => {
    const sourceItems = [
      createDummyPlaylistItem({ id: "1", videoId: "v1", author: "Artist A" }),
    ];

    vi.mocked(callWithRetries).mockResolvedValueOnce({
      status: 200,
      data: createFullPlaylist({ id: "source-1", items: sourceItems }),
    });

    const targetPlaylist = createFullPlaylist();
    mockFetchOrCreate(targetPlaylist);
    vi.mocked(shouldAddItem).mockReturnValue(false);

    const usecase = new ExtractPlaylistItemUsecase({
      ...baseOptions,
      allowDuplicate: false,
    });
    const result = await usecase.execute();

    expect(result.isOk()).toBe(true);
    // Only 1 call for getFullPlaylist, no addPlaylistItem
    expect(callWithRetries).toHaveBeenCalledTimes(1);
  });

  it("should add items when allowDuplicate=true", async () => {
    const sourceItems = [
      createDummyPlaylistItem({ id: "1", videoId: "v1", author: "Artist A" }),
    ];

    vi.mocked(callWithRetries)
      .mockResolvedValueOnce({
        status: 200,
        data: createFullPlaylist({ id: "source-1", items: sourceItems }),
      })
      .mockResolvedValueOnce({
        status: 200,
        data: createDummyPlaylistItem({}),
      });

    const targetPlaylist = createFullPlaylist();
    mockFetchOrCreate(targetPlaylist);

    const usecase = new ExtractPlaylistItemUsecase({
      ...baseOptions,
      allowDuplicate: true,
    });
    const result = await usecase.execute();

    expect(result.isOk()).toBe(true);
    expect(shouldAddItem).toHaveBeenCalledWith(
      targetPlaylist,
      sourceItems[0],
      true,
    );
  });

  it("should return err when source fetch fails", async () => {
    vi.mocked(callWithRetries).mockResolvedValueOnce({ status: 401 });

    const usecase = new ExtractPlaylistItemUsecase(baseOptions);
    const result = await usecase.execute();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.status).toBe(401);
    }
  });

  it("should return err when target creation fails", async () => {
    vi.mocked(callWithRetries).mockResolvedValueOnce({
      status: 200,
      data: createFullPlaylist({ id: "source-1", items: [] }),
    });

    mockFetchOrCreateError(401);

    const usecase = new ExtractPlaylistItemUsecase(baseOptions);
    const result = await usecase.execute();

    expect(result.isErr()).toBe(true);
  });

  it("should succeed with no item additions when no artists match", async () => {
    const sourceItems = [
      createDummyPlaylistItem({
        id: "1",
        videoId: "v1",
        author: "Other Artist",
      }),
    ];

    vi.mocked(callWithRetries).mockResolvedValueOnce({
      status: 200,
      data: createFullPlaylist({ id: "source-1", items: sourceItems }),
    });

    const targetPlaylist = createFullPlaylist();
    mockFetchOrCreate(targetPlaylist);

    const usecase = new ExtractPlaylistItemUsecase(baseOptions);
    const result = await usecase.execute();

    expect(result.isOk()).toBe(true);
    // Only 1 call for getFullPlaylist, no addPlaylistItem
    expect(callWithRetries).toHaveBeenCalledTimes(1);
  });
});
