import { beforeEach, describe, expect, it, vi } from "vitest";
import { callWithRetries } from "@/common/call-with-retries";
import { Provider } from "@/entities/provider";
import { createDummyPlaylistItem } from "@/features/playlist/entities";
import { getRandomInt, ShufflePlaylistUsecase } from "./shuffle-playlist";

vi.mock("@/common/call-with-retries", () => ({
  callWithRetries: vi.fn(),
}));

describe("getRandomInt", () => {
  it("should return 0 when min=0, max=0", () => {
    expect(getRandomInt(0, 0)).toBe(0);
  });

  it("should return the value when min equals max", () => {
    expect(getRandomInt(5, 5)).toBe(5);
  });

  it("should return an integer within range", () => {
    for (let i = 0; i < 100; i++) {
      const result = getRandomInt(0, 10);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  it("should always return an integer", () => {
    for (let i = 0; i < 100; i++) {
      const result = getRandomInt(0, 10);
      expect(Number.isInteger(result)).toBe(true);
    }
  });
});

describe("ShufflePlaylistUsecase", () => {
  const mockOptions = {
    repository: Provider.GOOGLE,
    targetPlaylistId: "playlist-1",
    ratio: 0.5,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should throw Error for negative ratio", async () => {
    const usecase = new ShufflePlaylistUsecase({
      ...mockOptions,
      ratio: -0.1,
    });
    await expect(usecase.execute()).rejects.toThrow("Invalid ratio");
  });

  it("should throw Error for ratio > 1", async () => {
    const usecase = new ShufflePlaylistUsecase({
      ...mockOptions,
      ratio: 1.1,
    });
    await expect(usecase.execute()).rejects.toThrow("Invalid ratio");
  });

  it("should return ok with no item moves when ratio=0", async () => {
    const items = [
      createDummyPlaylistItem({ id: "item-1", videoId: "v1" }),
      createDummyPlaylistItem({ id: "item-2", videoId: "v2" }),
    ];
    vi.mocked(callWithRetries).mockResolvedValueOnce({
      status: 200,
      data: {
        id: "playlist-1",
        title: "Test",
        thumbnailUrl: "https://example.com/img.jpg",
        itemsTotal: 2,
        url: "https://example.com/playlist",
        provider: Provider.GOOGLE,
        items,
      },
    });

    const usecase = new ShufflePlaylistUsecase({
      ...mockOptions,
      ratio: 0,
    });
    const result = await usecase.execute();

    expect(result.isOk()).toBe(true);
    // Only getFullPlaylist should be called, no updatePlaylistItemPosition
    expect(callWithRetries).toHaveBeenCalledTimes(1);
  });

  it("should attempt to move all items when ratio=1", async () => {
    const items = [
      createDummyPlaylistItem({ id: "item-1", videoId: "v1" }),
      createDummyPlaylistItem({ id: "item-2", videoId: "v2" }),
    ];
    vi.mocked(callWithRetries)
      .mockResolvedValueOnce({
        status: 200,
        data: {
          id: "playlist-1",
          title: "Test",
          thumbnailUrl: "https://example.com/img.jpg",
          itemsTotal: 2,
          url: "https://example.com/playlist",
          provider: Provider.GOOGLE,
          items,
        },
      })
      .mockResolvedValue({
        status: 200,
        data: createDummyPlaylistItem({}),
      });

    const usecase = new ShufflePlaylistUsecase({
      ...mockOptions,
      ratio: 1,
    });
    const result = await usecase.execute();

    expect(result.isOk()).toBe(true);
    // 1 (getFullPlaylist) + 2 (updatePlaylistItemPosition for each item)
    expect(callWithRetries).toHaveBeenCalledTimes(3);
  });

  it("should return err when getFullPlaylist fails", async () => {
    vi.mocked(callWithRetries).mockResolvedValueOnce({
      status: 401,
    });

    const usecase = new ShufflePlaylistUsecase(mockOptions);
    const result = await usecase.execute();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.status).toBe(401);
    }
  });

  it("should return err when updatePlaylistItemPosition fails", async () => {
    const items = [
      createDummyPlaylistItem({ id: "item-1", videoId: "v1" }),
      createDummyPlaylistItem({ id: "item-2", videoId: "v2" }),
    ];
    vi.mocked(callWithRetries)
      .mockResolvedValueOnce({
        status: 200,
        data: {
          id: "playlist-1",
          title: "Test",
          thumbnailUrl: "https://example.com/img.jpg",
          itemsTotal: 2,
          url: "https://example.com/playlist",
          provider: Provider.GOOGLE,
          items,
        },
      })
      .mockResolvedValueOnce({
        status: 401,
      });

    const usecase = new ShufflePlaylistUsecase({
      ...mockOptions,
      ratio: 1,
    });
    const result = await usecase.execute();

    expect(result.isErr()).toBe(true);
  });

  it("should call callbacks with correct arguments", async () => {
    const items = [createDummyPlaylistItem({ id: "item-1", videoId: "v1" })];
    const updatedItem = createDummyPlaylistItem({
      id: "item-1-updated",
      videoId: "v1",
    });
    vi.mocked(callWithRetries)
      .mockResolvedValueOnce({
        status: 200,
        data: {
          id: "playlist-1",
          title: "Test",
          thumbnailUrl: "https://example.com/img.jpg",
          itemsTotal: 1,
          url: "https://example.com/playlist",
          provider: Provider.GOOGLE,
          items,
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: updatedItem,
      });

    const onUpdating = vi.fn();
    const onUpdated = vi.fn();

    const usecase = new ShufflePlaylistUsecase({
      ...mockOptions,
      ratio: 1,
      onUpdatingPlaylistItemPosition: onUpdating,
      onUpdatedPlaylistItemPosition: onUpdated,
    });
    await usecase.execute();

    expect(onUpdating).toHaveBeenCalledOnce();
    expect(onUpdating).toHaveBeenCalledWith(
      items[0],
      expect.any(Number),
      expect.any(Number),
    );
    expect(onUpdated).toHaveBeenCalledOnce();
    expect(onUpdated).toHaveBeenCalledWith(
      updatedItem,
      expect.any(Number),
      expect.any(Number),
      0,
      1,
    );
  });
});
