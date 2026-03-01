import { describe, expect, it, vi } from "vitest";
import { UserDbRepository } from "./repository";

function createMockDb() {
  return {
    query: {
      account: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(),
  };
}

describe("UserDbRepository", () => {
  describe("findAccountById", () => {
    it("returns null when no row found", async () => {
      const db = createMockDb();
      db.query.account.findFirst.mockResolvedValue(undefined);
      const repo = new UserDbRepository(db as never);

      const result = await repo.findAccountById("acc-1");

      expect(result).toBeNull();
      expect(db.query.account.findFirst).toHaveBeenCalledOnce();
    });

    it("returns id and providerId when row found", async () => {
      const db = createMockDb();
      db.query.account.findFirst.mockResolvedValue({
        id: "acc-1",
        providerId: "google",
        accountId: "gid-1",
        scope: "openid",
      });
      const repo = new UserDbRepository(db as never);

      const result = await repo.findAccountById("acc-1");

      expect(result).toEqual({ id: "acc-1", providerId: "google" });
    });

    it("propagates db error", async () => {
      const db = createMockDb();
      db.query.account.findFirst.mockRejectedValue(new Error("DB error"));
      const repo = new UserDbRepository(db as never);

      await expect(repo.findAccountById("acc-1")).rejects.toThrow("DB error");
    });
  });

  describe("findAccountsByUserId", () => {
    it("returns accounts for the given userId", async () => {
      const rows = [
        {
          id: "acc-1",
          providerId: "google",
          accountId: "gid-1",
          scope: "openid",
        },
        { id: "acc-2", providerId: "spotify", accountId: "sid-1", scope: null },
      ];

      const orderByMock = vi.fn().mockResolvedValue(rows);
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      const selectMock = vi.fn().mockReturnValue({ from: fromMock });

      const db = { select: selectMock } as never;
      const repo = new UserDbRepository(db);

      const result = await repo.findAccountsByUserId("user-1");

      expect(result).toEqual(rows);
      expect(selectMock).toHaveBeenCalledOnce();
      expect(whereMock).toHaveBeenCalledWith(expect.anything());
    });

    it("propagates db error", async () => {
      const orderByMock = vi.fn().mockRejectedValue(new Error("DB error"));
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      const selectMock = vi.fn().mockReturnValue({ from: fromMock });

      const db = { select: selectMock } as never;
      const repo = new UserDbRepository(db);

      await expect(repo.findAccountsByUserId("user-1")).rejects.toThrow(
        "DB error",
      );
    });
  });
});
