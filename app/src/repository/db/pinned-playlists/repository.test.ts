import { describe, expect, it, vi } from "vitest";
import { PinnedPlaylistsDbRepository } from "./repository";

function createMockDb() {
  return {
    query: {
      pinnedPlaylists: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    delete: vi.fn(),
  };
}

describe("PinnedPlaylistsDbRepository", () => {
  describe("findManyByUserId", () => {
    it("returns playlist rows for the given userId", async () => {
      const rows = [{ playlistId: "pl-1" }, { playlistId: "pl-2" }];
      const db = createMockDb();
      db.query.pinnedPlaylists.findMany.mockResolvedValue(rows);
      const repo = new PinnedPlaylistsDbRepository(db as never);

      const result = await repo.findManyByUserId("user-1");

      expect(result).toEqual(rows);
      expect(db.query.pinnedPlaylists.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.anything() }),
      );
    });

    it("propagates db error", async () => {
      const db = createMockDb();
      db.query.pinnedPlaylists.findMany.mockRejectedValue(
        new Error("DB error"),
      );
      const repo = new PinnedPlaylistsDbRepository(db as never);

      await expect(repo.findManyByUserId("user-1")).rejects.toThrow("DB error");
    });
  });

  describe("insert", () => {
    it("calls db.insert with correct data", async () => {
      const onConflictDoNothingMock = vi.fn().mockResolvedValue(undefined);
      const valuesMock = vi.fn().mockReturnValue({
        onConflictDoNothing: onConflictDoNothingMock,
      });
      const db = {
        insert: vi.fn().mockReturnValue({ values: valuesMock }),
      } as never;
      const repo = new PinnedPlaylistsDbRepository(db);

      await repo.insert({
        userId: "user-1",
        accountId: "acc-1",
        playlistId: "pl-1",
        provider: "youtube",
      });

      expect(db.insert).toHaveBeenCalledOnce();
      expect(onConflictDoNothingMock).toHaveBeenCalledOnce();

      const calledWith = valuesMock.mock.calls[0][0];
      expect(calledWith.userId).toBe("user-1");
      expect(calledWith.accountId).toBe("acc-1");
      expect(calledWith.playlistId).toBe("pl-1");
      expect(calledWith.provider).toBe("youtube");
    });

    it("propagates db error", async () => {
      const db = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoNothing: vi
              .fn()
              .mockRejectedValue(new Error("DB error")),
          }),
        }),
      } as never;
      const repo = new PinnedPlaylistsDbRepository(db);

      await expect(
        repo.insert({
          userId: "user-1",
          accountId: "acc-1",
          playlistId: "pl-1",
          provider: "youtube",
        }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("delete", () => {
    it("calls db.delete once", async () => {
      const whereMock = vi.fn().mockResolvedValue(undefined);
      const db = {
        delete: vi.fn().mockReturnValue({ where: whereMock }),
      } as never;
      const repo = new PinnedPlaylistsDbRepository(db);

      await repo.delete("user-1", "acc-1", "pl-1");

      expect(db.delete).toHaveBeenCalledOnce();
      expect(whereMock).toHaveBeenCalledOnce();
    });

    it("propagates db error", async () => {
      const db = {
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      } as never;
      const repo = new PinnedPlaylistsDbRepository(db);

      await expect(repo.delete("user-1", "acc-1", "pl-1")).rejects.toThrow(
        "DB error",
      );
    });
  });
});
