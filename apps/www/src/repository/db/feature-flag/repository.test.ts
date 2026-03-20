import { describe, expect, it, vi } from "vitest";
import { FeatureFlagName } from "@/lib/feature-flags";
import { FeatureFlagDbRepository } from "./repository";

function createMockDb() {
  const onConflictDoNothingMock = vi.fn().mockResolvedValue(undefined);
  const valuesMock = vi
    .fn()
    .mockReturnValue({ onConflictDoNothing: onConflictDoNothingMock });
  const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

  const whereMock = vi.fn().mockResolvedValue(undefined);
  const deleteMock = vi.fn().mockReturnValue({ where: whereMock });

  const fromMock = vi.fn();
  const selectMock = vi.fn().mockReturnValue({ from: fromMock });

  return {
    select: selectMock,
    insert: insertMock,
    delete: deleteMock,
    _mocks: {
      selectMock,
      fromMock,
      insertMock,
      valuesMock,
      onConflictDoNothingMock,
      deleteMock,
      whereMock,
    },
  };
}

describe("FeatureFlagDbRepository", () => {
  describe("findEnabledFlagsByUserId", () => {
    it("returns enabled flag names for the given userId", async () => {
      const db = createMockDb();
      const rows = [{ flagName: FeatureFlagName.temp }];
      const whereMock = vi.fn().mockResolvedValue(rows);
      db._mocks.fromMock.mockReturnValue({ where: whereMock });

      const repo = new FeatureFlagDbRepository(db as never);
      const result = await repo.findEnabledFlagsByUserId("user-1");

      expect(result).toEqual([FeatureFlagName.temp]);
      expect(db.select).toHaveBeenCalledOnce();
      expect(whereMock).toHaveBeenCalledWith(expect.anything());
    });

    it("filters out unknown flag names", async () => {
      const db = createMockDb();
      const rows = [
        { flagName: "unknownFlag" },
        { flagName: FeatureFlagName.temp },
      ];
      const whereMock = vi.fn().mockResolvedValue(rows);
      db._mocks.fromMock.mockReturnValue({ where: whereMock });

      const repo = new FeatureFlagDbRepository(db as never);
      const result = await repo.findEnabledFlagsByUserId("user-1");

      expect(result).toEqual([FeatureFlagName.temp]);
    });

    it("returns empty array when no rows found", async () => {
      const db = createMockDb();
      const whereMock = vi.fn().mockResolvedValue([]);
      db._mocks.fromMock.mockReturnValue({ where: whereMock });

      const repo = new FeatureFlagDbRepository(db as never);
      const result = await repo.findEnabledFlagsByUserId("user-1");

      expect(result).toEqual([]);
    });

    it("propagates db error", async () => {
      const db = createMockDb();
      const whereMock = vi.fn().mockRejectedValue(new Error("DB error"));
      db._mocks.fromMock.mockReturnValue({ where: whereMock });

      const repo = new FeatureFlagDbRepository(db as never);
      await expect(repo.findEnabledFlagsByUserId("user-1")).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("insert", () => {
    it("inserts a flag for a user with onConflictDoNothing", async () => {
      const db = createMockDb();
      const repo = new FeatureFlagDbRepository(db as never);

      await repo.insert(FeatureFlagName.temp, "user-1");

      expect(db.insert).toHaveBeenCalledOnce();
      expect(db._mocks.valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          flagName: FeatureFlagName.temp,
          userId: "user-1",
        }),
      );
      expect(db._mocks.onConflictDoNothingMock).toHaveBeenCalledOnce();
    });

    it("propagates db error", async () => {
      const db = createMockDb();
      db._mocks.onConflictDoNothingMock.mockRejectedValue(
        new Error("DB error"),
      );
      const repo = new FeatureFlagDbRepository(db as never);

      await expect(repo.insert(FeatureFlagName.temp, "user-1")).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("delete", () => {
    it("deletes a flag for a user", async () => {
      const db = createMockDb();
      const repo = new FeatureFlagDbRepository(db as never);

      await repo.delete(FeatureFlagName.temp, "user-1");

      expect(db.delete).toHaveBeenCalledOnce();
      expect(db._mocks.whereMock).toHaveBeenCalledWith(expect.anything());
    });

    it("propagates db error", async () => {
      const db = createMockDb();
      db._mocks.whereMock.mockRejectedValue(new Error("DB error"));
      const repo = new FeatureFlagDbRepository(db as never);

      await expect(repo.delete(FeatureFlagName.temp, "user-1")).rejects.toThrow(
        "DB error",
      );
    });
  });
});
