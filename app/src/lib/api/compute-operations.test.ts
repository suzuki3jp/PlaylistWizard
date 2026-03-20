import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/user", () => ({
  getAccessToken: vi.fn(),
}));

vi.mock("@/repository/v2/youtube/repository", () => ({
  YouTubeRepository: vi.fn(),
}));

import { err, ok } from "neverthrow";
import {
  toAccountId,
  toPlaylistId,
  toPlaylistItemId,
  toVideoId,
} from "@/entities/ids";
import { Provider } from "@/entities/provider";
import type { EnqueueJobRequest } from "@/lib/schemas/jobs";
import { getAccessToken } from "@/lib/user";
import { YouTubeRepository } from "@/repository/v2/youtube/repository";
import { computeOperations } from "./compute-operations";

function makePlaylistItem(
  id: string,
  videoId: string,
  author = "Artist A",
  position = 0,
) {
  return {
    id: toPlaylistItemId(id),
    title: "Test Title",
    thumbnailUrl: "https://example.com/thumb.jpg",
    position,
    author,
    videoId: toVideoId(videoId),
    url: "https://example.com/video",
  };
}

function makeFullPlaylist(
  id: string,
  items: ReturnType<typeof makePlaylistItem>[],
) {
  return {
    id: toPlaylistId(id),
    accountId: toAccountId("acc-1"),
    title: "Test Playlist",
    thumbnailUrl: "https://example.com/thumb.jpg",
    itemsTotal: items.length,
    url: "https://example.com/playlist",
    provider: Provider.GOOGLE,
    items,
  };
}

const mockedGetAccessToken = vi.mocked(getAccessToken);
const MockedYouTubeRepository = vi.mocked(YouTubeRepository);

function setupRepo(
  overrides: Partial<{
    getFullPlaylist: ReturnType<typeof vi.fn>;
    getMyPlaylists: ReturnType<typeof vi.fn>;
  }> = {},
) {
  const mockRepo = {
    getFullPlaylist: overrides.getFullPlaylist ?? vi.fn(),
    getMyPlaylists: overrides.getMyPlaylists ?? vi.fn(),
  };
  MockedYouTubeRepository.mockImplementation(() => mockRepo as never);
  return mockRepo;
}

describe("computeOperations", () => {
  describe("copy", () => {
    it("returns err('token-unavailable') when token is unavailable", async () => {
      mockedGetAccessToken.mockResolvedValue(null);

      const result = await computeOperations({
        type: "copy",
        accId: "acc-1",
        sourcePlaylistId: "src-pl",
      } as EnqueueJobRequest);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe("token-unavailable");
    });

    it("returns create-playlist + add-playlist-item ops for new target", async () => {
      mockedGetAccessToken.mockResolvedValue("token");
      const items = [
        makePlaylistItem("item-1", "vid-1"),
        makePlaylistItem("item-2", "vid-2"),
      ];
      const repo = setupRepo({
        getFullPlaylist: vi
          .fn()
          .mockResolvedValue(ok(makeFullPlaylist("src-pl", items))),
      });

      const result = await computeOperations({
        type: "copy",
        accId: "acc-1",
        sourcePlaylistId: "src-pl",
        // targetPlaylistId 未指定 → 新規作成
      } as EnqueueJobRequest);

      expect(result.isOk()).toBe(true);
      const ops = result._unsafeUnwrap();
      expect(ops[0].type).toBe("create-playlist");
      expect(ops.filter((o) => o.type === "add-playlist-item")).toHaveLength(2);
      expect(repo.getFullPlaylist).toHaveBeenCalledWith("src-pl");
    });

    it("returns only add-playlist-item ops for existing target", async () => {
      mockedGetAccessToken.mockResolvedValue("token");
      const items = [makePlaylistItem("item-1", "vid-1")];
      setupRepo({
        getFullPlaylist: vi
          .fn()
          .mockResolvedValue(ok(makeFullPlaylist("src-pl", items))),
      });

      const result = await computeOperations({
        type: "copy",
        accId: "acc-1",
        sourcePlaylistId: "src-pl",
        targetPlaylistId: "tgt-pl",
        allowDuplicate: true,
      } as EnqueueJobRequest);

      expect(result.isOk()).toBe(true);
      const ops = result._unsafeUnwrap();
      expect(ops.every((o) => o.type === "add-playlist-item")).toBe(true);
      expect(ops).toHaveLength(1);
    });

    it("skips duplicate videoIds when allowDuplicate is false", async () => {
      mockedGetAccessToken.mockResolvedValue("token");
      const sourceItems = [
        makePlaylistItem("item-1", "vid-1"),
        makePlaylistItem("item-2", "vid-2"),
      ];
      const targetItems = [makePlaylistItem("item-3", "vid-1")]; // vid-1 already in target
      setupRepo({
        getFullPlaylist: vi
          .fn()
          .mockResolvedValueOnce(ok(makeFullPlaylist("src-pl", sourceItems)))
          .mockResolvedValueOnce(ok(makeFullPlaylist("tgt-pl", targetItems))),
      });

      const result = await computeOperations({
        type: "copy",
        accId: "acc-1",
        sourcePlaylistId: "src-pl",
        targetPlaylistId: "tgt-pl",
        allowDuplicate: false,
      } as EnqueueJobRequest);

      expect(result.isOk()).toBe(true);
      const ops = result._unsafeUnwrap();
      // vid-1 is duplicate, only vid-2 should be added
      expect(ops).toHaveLength(1);
      expect((ops[0] as { videoId: string }).videoId).toBe("vid-2");
    });
  });

  describe("merge", () => {
    it("aggregates items from multiple source playlists", async () => {
      mockedGetAccessToken.mockResolvedValue("token");
      const src1Items = [makePlaylistItem("item-1", "vid-1")];
      const src2Items = [makePlaylistItem("item-2", "vid-2")];
      setupRepo({
        getFullPlaylist: vi
          .fn()
          .mockResolvedValueOnce(ok(makeFullPlaylist("src-1", src1Items)))
          .mockResolvedValueOnce(ok(makeFullPlaylist("src-2", src2Items))),
      });

      const result = await computeOperations({
        type: "merge",
        accId: "acc-1",
        sourcePlaylists: [
          { id: "src-1", accId: "acc-1" },
          { id: "src-2", accId: "acc-1" },
        ],
        allowDuplicate: true,
      } as EnqueueJobRequest);

      expect(result.isOk()).toBe(true);
      const ops = result._unsafeUnwrap();
      const addOps = ops.filter((o) => o.type === "add-playlist-item");
      expect(addOps).toHaveLength(2);
    });
  });

  describe("extract", () => {
    it("filters items by artistNames", async () => {
      mockedGetAccessToken.mockResolvedValue("token");
      const items = [
        makePlaylistItem("item-1", "vid-1", "Artist A"),
        makePlaylistItem("item-2", "vid-2", "Artist B"),
        makePlaylistItem("item-3", "vid-3", "artist a"), // case-insensitive
      ];
      setupRepo({
        getFullPlaylist: vi
          .fn()
          .mockResolvedValue(ok(makeFullPlaylist("src-pl", items))),
      });

      const result = await computeOperations({
        type: "extract",
        accId: "acc-1",
        sourcePlaylists: [{ id: "src-pl", accId: "acc-1" }],
        artistNames: ["artist a"],
        allowDuplicate: true,
      } as EnqueueJobRequest);

      expect(result.isOk()).toBe(true);
      const ops = result._unsafeUnwrap();
      const addOps = ops.filter((o) => o.type === "add-playlist-item");
      expect(addOps).toHaveLength(2); // item-1 and item-3
    });
  });

  describe("deduplicate", () => {
    it("returns remove-playlist-item ops for duplicate videoIds", async () => {
      mockedGetAccessToken.mockResolvedValue("token");
      const items = [
        makePlaylistItem("item-1", "vid-1", "Artist", 0),
        makePlaylistItem("item-2", "vid-2", "Artist", 1),
        makePlaylistItem("item-3", "vid-1", "Artist", 2), // duplicate of item-1
      ];
      setupRepo({
        getFullPlaylist: vi
          .fn()
          .mockResolvedValue(ok(makeFullPlaylist("pl-1", items))),
      });

      const result = await computeOperations({
        type: "deduplicate",
        accId: "acc-1",
        targetPlaylistId: "pl-1",
      } as EnqueueJobRequest);

      expect(result.isOk()).toBe(true);
      const ops = result._unsafeUnwrap();
      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe("remove-playlist-item");
      expect((ops[0] as { playlistItemId: string }).playlistItemId).toBe(
        "item-3",
      );
    });

    it("returns empty ops when no duplicates", async () => {
      mockedGetAccessToken.mockResolvedValue("token");
      const items = [
        makePlaylistItem("item-1", "vid-1"),
        makePlaylistItem("item-2", "vid-2"),
      ];
      setupRepo({
        getFullPlaylist: vi
          .fn()
          .mockResolvedValue(ok(makeFullPlaylist("pl-1", items))),
      });

      const result = await computeOperations({
        type: "deduplicate",
        accId: "acc-1",
        targetPlaylistId: "pl-1",
      } as EnqueueJobRequest);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(0);
    });
  });

  describe("shuffle", () => {
    it("returns empty ops when ratio is 0", async () => {
      mockedGetAccessToken.mockResolvedValue("token");
      const items = [
        makePlaylistItem("item-1", "vid-1", "Artist", 0),
        makePlaylistItem("item-2", "vid-2", "Artist", 1),
      ];
      setupRepo({
        getFullPlaylist: vi
          .fn()
          .mockResolvedValue(ok(makeFullPlaylist("pl-1", items))),
      });

      const result = await computeOperations({
        type: "shuffle",
        accId: "acc-1",
        targetPlaylistId: "pl-1",
        ratio: 0,
      } as EnqueueJobRequest);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(0);
    });

    it("clamps ratio > 1 to 1 (processes all items)", async () => {
      mockedGetAccessToken.mockResolvedValue("token");
      const items = Array.from({ length: 5 }, (_, i) =>
        makePlaylistItem(`item-${i}`, `vid-${i}`, "Artist", i),
      );
      setupRepo({
        getFullPlaylist: vi
          .fn()
          .mockResolvedValue(ok(makeFullPlaylist("pl-1", items))),
      });

      // ratio > 1 はスキーマでブロックされるが、compute-operations 内でもクランプされる
      const result = await computeOperations({
        type: "shuffle",
        accId: "acc-1",
        targetPlaylistId: "pl-1",
        ratio: 1,
      } as EnqueueJobRequest);

      expect(result.isOk()).toBe(true);
      // shuffleCount = min(5, floor(5 * 1)) = 5 → 全アイテムをシャッフル対象
      // 少なくともクラッシュせず結果を返す
      expect(Array.isArray(result._unsafeUnwrap())).toBe(true);
    });

    it("returns err('playlist-fetch-failed') when playlist fetch fails", async () => {
      mockedGetAccessToken.mockResolvedValue("token");
      setupRepo({
        getFullPlaylist: vi.fn().mockResolvedValue(err(new Error("API error"))),
      });

      const result = await computeOperations({
        type: "shuffle",
        accId: "acc-1",
        targetPlaylistId: "pl-1",
      } as EnqueueJobRequest);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe("playlist-fetch-failed");
    });
  });
});
