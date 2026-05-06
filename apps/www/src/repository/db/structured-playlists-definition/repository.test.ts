import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import { describe, expect, it, vi } from "vitest";
import { toAccountId, toUserId } from "@/entities/ids";
import { Provider } from "@/entities/provider";
import { StructuredPlaylistsDefinitionDbRepository } from "./repository";

const mockDefinition: StructuredPlaylistsDefinition = {
  version: 1,
  name: "test",
  provider: Provider.GOOGLE,
  playlists: [],
};

function createMockDb() {
  return {
    query: {
      structuredPlaylistsDefinition: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    delete: vi.fn(),
  };
}

describe("StructuredPlaylistsDefinitionDbRepository", () => {
  describe("findManyByUserId", () => {
    it("returns rows for the given userId", async () => {
      const rows = [
        { accId: "acc-1", definition: mockDefinition },
        { accId: "acc-2", definition: mockDefinition },
      ];
      const findManyMock = vi.fn().mockResolvedValue(rows);
      const db = createMockDb();
      db.query.structuredPlaylistsDefinition.findMany = findManyMock;
      const repo = new StructuredPlaylistsDefinitionDbRepository(db);

      const result = await repo.findManyByUserId(toUserId("user-1"));

      expect(result).toEqual(rows);
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.anything() }),
      );
    });

    it("propagates db error", async () => {
      const db = createMockDb();
      db.query.structuredPlaylistsDefinition.findMany.mockRejectedValue(
        new Error("DB error"),
      );
      const repo = new StructuredPlaylistsDefinitionDbRepository(db);

      await expect(repo.findManyByUserId(toUserId("user-1"))).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("upsert", () => {
    it("calls db.insert with onConflictDoUpdate", async () => {
      const onConflictDoUpdateMock = vi.fn().mockResolvedValue(undefined);
      const valuesMock = vi.fn().mockReturnValue({
        onConflictDoUpdate: onConflictDoUpdateMock,
      });
      const db = createMockDb();
      db.insert.mockReturnValue({ values: valuesMock });
      const repo = new StructuredPlaylistsDefinitionDbRepository(db);

      await repo.upsert(
        toUserId("user-1"),
        toAccountId("acc-1"),
        mockDefinition,
      );

      expect(db.insert).toHaveBeenCalledOnce();
      expect(onConflictDoUpdateMock).toHaveBeenCalledOnce();
    });

    it("propagates db error", async () => {
      const db = createMockDb();
      db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      });
      const repo = new StructuredPlaylistsDefinitionDbRepository(db);

      await expect(
        repo.upsert(toUserId("user-1"), toAccountId("acc-1"), mockDefinition),
      ).rejects.toThrow("DB error");
    });
  });

  describe("delete", () => {
    it("calls db.delete once", async () => {
      const whereMock = vi.fn().mockResolvedValue(undefined);
      const db = createMockDb();
      db.delete.mockReturnValue({ where: whereMock });
      const repo = new StructuredPlaylistsDefinitionDbRepository(db);

      await repo.delete(toUserId("user-1"), toAccountId("acc-1"));

      expect(db.delete).toHaveBeenCalledOnce();
      expect(whereMock).toHaveBeenCalledOnce();
    });

    it("propagates db error", async () => {
      const db = createMockDb();
      db.delete.mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error("DB error")),
      });
      const repo = new StructuredPlaylistsDefinitionDbRepository(db);

      await expect(
        repo.delete(toUserId("user-1"), toAccountId("acc-1")),
      ).rejects.toThrow("DB error");
    });
  });
});
