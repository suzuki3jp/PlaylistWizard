import { describe, expect, it, vi } from "vitest";
import { toUserId } from "@/entities/ids";
import { UserDbRepository } from "./repository";

function createMockDb() {
  return {
    select: vi.fn(),
  };
}

describe("UserDbRepository", () => {
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

      const db = createMockDb();
      db.select = selectMock;
      const repo = new UserDbRepository(db);

      const result = await repo.findAccountsByUserId(toUserId("user-1"));

      expect(result).toEqual(rows);
      expect(selectMock).toHaveBeenCalledOnce();
      expect(whereMock).toHaveBeenCalledWith(expect.anything());
    });

    it("propagates db error", async () => {
      const orderByMock = vi.fn().mockRejectedValue(new Error("DB error"));
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      const selectMock = vi.fn().mockReturnValue({ from: fromMock });

      const db = createMockDb();
      db.select = selectMock;
      const repo = new UserDbRepository(db);

      await expect(
        repo.findAccountsByUserId(toUserId("user-1")),
      ).rejects.toThrow("DB error");
    });
  });
});
