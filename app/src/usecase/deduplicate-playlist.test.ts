import { beforeEach, describe, expect, it, vi } from "vitest";
import { callWithRetries } from "@/common/call-with-retries";
import { Provider } from "@/entities/provider";
import { createDummyPlaylistItem } from "@/features/playlist/entities";
import { DeduplicatePlaylistUsecase } from "./deduplicate-playlist";

vi.mock("@/common/call-with-retries", () => ({
  callWithRetries: vi.fn(),
}));

function createFullPlaylistResult(
  items: ReturnType<typeof createDummyPlaylistItem>[],
) {
  return {
    status: 200 as const,
    data: {
      id: "playlist-1",
      title: "Test Playlist",
      thumbnailUrl: "https://example.com/img.jpg",
      itemsTotal: items.length,
      url: "https://example.com/playlist",
      provider: Provider.GOOGLE,
      items,
    },
  };
}

describe("DeduplicatePlaylistUsecase", () => {
  const mockOptions = {
    repository: Provider.GOOGLE,
    targetPlaylistId: "playlist-1",
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return ok([]) when no duplicates exist", async () => {
    const items = [
      createDummyPlaylistItem({ id: "1", videoId: "v1" }),
      createDummyPlaylistItem({ id: "2", videoId: "v2" }),
      createDummyPlaylistItem({ id: "3", videoId: "v3" }),
    ];
    vi.mocked(callWithRetries).mockResolvedValueOnce(
      createFullPlaylistResult(items),
    );

    const usecase = new DeduplicatePlaylistUsecase(mockOptions);
    const result = await usecase.execute();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });

  it("should return the duplicate item when one duplicate exists", async () => {
    const items = [
      createDummyPlaylistItem({ id: "1", videoId: "v1" }),
      createDummyPlaylistItem({ id: "2", videoId: "v2" }),
      createDummyPlaylistItem({ id: "3", videoId: "v1" }), // duplicate of v1
    ];
    vi.mocked(callWithRetries)
      .mockResolvedValueOnce(createFullPlaylistResult(items))
      .mockResolvedValueOnce({ status: 200, data: undefined });

    const usecase = new DeduplicatePlaylistUsecase(mockOptions);
    const result = await usecase.execute();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe("3");
    }
  });

  it("should return all duplicates when same videoId appears 3 times", async () => {
    const items = [
      createDummyPlaylistItem({ id: "1", videoId: "v1" }),
      createDummyPlaylistItem({ id: "2", videoId: "v1" }), // dup
      createDummyPlaylistItem({ id: "3", videoId: "v1" }), // dup
    ];
    vi.mocked(callWithRetries)
      .mockResolvedValueOnce(createFullPlaylistResult(items))
      .mockResolvedValue({ status: 200, data: undefined });

    const usecase = new DeduplicatePlaylistUsecase(mockOptions);
    const result = await usecase.execute();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe("2");
      expect(result.value[1].id).toBe("3");
    }
  });

  it("should not treat different videoIds as duplicates", async () => {
    const items = [
      createDummyPlaylistItem({ id: "1", videoId: "v1" }),
      createDummyPlaylistItem({ id: "2", videoId: "v2" }),
    ];
    vi.mocked(callWithRetries).mockResolvedValueOnce(
      createFullPlaylistResult(items),
    );

    const usecase = new DeduplicatePlaylistUsecase(mockOptions);
    const result = await usecase.execute();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });

  it("should return err when getFullPlaylist fails", async () => {
    vi.mocked(callWithRetries).mockResolvedValueOnce({ status: 401 });

    const usecase = new DeduplicatePlaylistUsecase(mockOptions);
    const result = await usecase.execute();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.status).toBe(401);
    }
  });

  it("should return err when removePlaylistItem fails", async () => {
    const items = [
      createDummyPlaylistItem({ id: "1", videoId: "v1" }),
      createDummyPlaylistItem({ id: "2", videoId: "v1" }), // dup
    ];
    vi.mocked(callWithRetries)
      .mockResolvedValueOnce(createFullPlaylistResult(items))
      .mockResolvedValueOnce({ status: 401 });

    const usecase = new DeduplicatePlaylistUsecase(mockOptions);
    const result = await usecase.execute();

    expect(result.isErr()).toBe(true);
  });

  it("should call callbacks correctly", async () => {
    const items = [
      createDummyPlaylistItem({ id: "1", videoId: "v1" }),
      createDummyPlaylistItem({ id: "2", videoId: "v1" }), // dup
    ];
    vi.mocked(callWithRetries)
      .mockResolvedValueOnce(createFullPlaylistResult(items))
      .mockResolvedValueOnce({ status: 200, data: undefined });

    const onRemoving = vi.fn();
    const onRemoved = vi.fn();

    const usecase = new DeduplicatePlaylistUsecase({
      ...mockOptions,
      onRemovingPlaylistItem: onRemoving,
      onRemovedPlaylistItem: onRemoved,
    });
    await usecase.execute();

    expect(onRemoving).toHaveBeenCalledOnce();
    expect(onRemoving).toHaveBeenCalledWith(items[1]);
    expect(onRemoved).toHaveBeenCalledOnce();
    expect(onRemoved).toHaveBeenCalledWith(items[1], 0, 1);
  });
});
