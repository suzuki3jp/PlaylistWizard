import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import { describe, expect, it, vi } from "vitest";
import { StructuredPlaylistsDefinitionDbRepository } from "./repository";

const mockDefinition: StructuredPlaylistsDefinition = {
  playlists: [],
};

describe("StructuredPlaylistsDefinitionDbRepository", () => {
  describe("findManyByUserId", () => {
    it("returns rows for the given userId", async () => {
      const rows = [
        { accId: "acc-1", definition: mockDefinition },
        { accId: "acc-2", definition: mockDefinition },
      ];
      const findManyMock = vi.fn().mockResolvedValue(rows);
      const db = {
        query: {
          structuredPlaylistsDefinition: {
            findMany: findManyMock,
          },
        },
      } as never;
      const repo = new StructuredPlaylistsDefinitionDbRepository(db);

      const result = await repo.findManyByUserId("user-1");

      expect(result).toEqual(rows);
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.anything() }),
      );
    });

    it("propagates db error", async () => {
      const db = {
        query: {
          structuredPlaylistsDefinition: {
            findMany: vi.fn().mockRejectedValue(new Error("DB error")),
          },
        },
      } as never;
      const repo = new StructuredPlaylistsDefinitionDbRepository(db);

      await expect(repo.findManyByUserId("user-1")).rejects.toThrow("DB error");
    });
  });

  describe("upsert", () => {
    it("calls db.insert with onConflictDoUpdate", async () => {
      const onConflictDoUpdateMock = vi.fn().mockResolvedValue(undefined);
      const valuesMock = vi.fn().mockReturnValue({
        onConflictDoUpdate: onConflictDoUpdateMock,
      });
      const db = {
        insert: vi.fn().mockReturnValue({ values: valuesMock }),
      } as never;
      const repo = new StructuredPlaylistsDefinitionDbRepository(db);

      await repo.upsert("user-1", "acc-1", mockDefinition);

      expect(db.insert).toHaveBeenCalledOnce();
      expect(onConflictDoUpdateMock).toHaveBeenCalledOnce();
    });

    it("propagates db error", async () => {
      const db = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoUpdate: vi
              .fn()
              .mockRejectedValue(new Error("DB error")),
          }),
        }),
      } as never;
      const repo = new StructuredPlaylistsDefinitionDbRepository(db);

      await expect(
        repo.upsert("user-1", "acc-1", mockDefinition),
      ).rejects.toThrow("DB error");
    });
  });

  describe("delete", () => {
    it("calls db.delete once", async () => {
      const whereMock = vi.fn().mockResolvedValue(undefined);
      const db = {
        delete: vi.fn().mockReturnValue({ where: whereMock }),
      } as never;
      const repo = new StructuredPlaylistsDefinitionDbRepository(db);

      await repo.delete("user-1", "acc-1");

      expect(db.delete).toHaveBeenCalledOnce();
      expect(whereMock).toHaveBeenCalledOnce();
    });

    it("propagates db error", async () => {
      const db = {
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      } as never;
      const repo = new StructuredPlaylistsDefinitionDbRepository(db);

      await expect(repo.delete("user-1", "acc-1")).rejects.toThrow("DB error");
    });
  });
});
