import { describe, expect, it, vi } from "vitest";
import { JobsDbRepository } from "./repository";

function createMockDb() {
  return {
    query: {
      jobs: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
    execute: vi.fn(),
  };
}

describe("JobsDbRepository", () => {
  describe("createJob", () => {
    it("inserts a job and returns the created row", async () => {
      const row = {
        id: "job-1",
        userId: "user-1",
        accId: "acc-1",
        type: "copy",
        status: "pending",
        operations: [],
        totalOpCount: 5,
        progress: 0,
        result: { completedOpIndices: [] },
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const returningMock = vi.fn().mockResolvedValue([row]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
      const db = { insert: insertMock } as never;
      const repo = new JobsDbRepository(db);

      const result = await repo.createJob({
        userId: "user-1" as never,
        accId: "acc-1",
        type: "copy",
        operations: [],
        totalOpCount: 5,
      });

      expect(insertMock).toHaveBeenCalledOnce();
      expect(returningMock).toHaveBeenCalledOnce();
      expect(result).toEqual(row);

      const calledWith = valuesMock.mock.calls[0][0];
      expect(calledWith.userId).toBe("user-1");
      expect(calledWith.accId).toBe("acc-1");
      expect(calledWith.type).toBe("copy");
      expect(calledWith.payload).toEqual({ operations: [] });
      expect(calledWith.result).toBeUndefined();
    });

    it("propagates db error", async () => {
      const db = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue(new Error("DB error")),
          }),
        }),
      } as never;
      const repo = new JobsDbRepository(db);

      await expect(
        repo.createJob({
          userId: "user-1" as never,
          accId: "acc-1",
          type: "copy",
          operations: [],
          totalOpCount: 5,
        }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("getJob", () => {
    it("returns job row when found without userId", async () => {
      const row = { id: "job-1", userId: "user-1", status: "pending" };
      const db = createMockDb();
      db.query.jobs.findFirst.mockResolvedValue(row);
      const repo = new JobsDbRepository(db as never);

      const result = await repo.getJob("job-1");

      expect(result).toEqual(row);
      expect(db.query.jobs.findFirst).toHaveBeenCalledOnce();
    });

    it("returns job row when found with userId", async () => {
      const row = { id: "job-1", userId: "user-1", status: "pending" };
      const db = createMockDb();
      db.query.jobs.findFirst.mockResolvedValue(row);
      const repo = new JobsDbRepository(db as never);

      const result = await repo.getJob("job-1", "user-1" as never);

      expect(result).toEqual(row);
      expect(db.query.jobs.findFirst).toHaveBeenCalledOnce();
    });

    it("returns null when not found", async () => {
      const db = createMockDb();
      db.query.jobs.findFirst.mockResolvedValue(undefined);
      const repo = new JobsDbRepository(db as never);

      const result = await repo.getJob("job-1");

      expect(result).toBeNull();
    });

    it("propagates db error", async () => {
      const db = createMockDb();
      db.query.jobs.findFirst.mockRejectedValue(new Error("DB error"));
      const repo = new JobsDbRepository(db as never);

      await expect(repo.getJob("job-1")).rejects.toThrow("DB error");
    });
  });

  describe("getJobByWorker", () => {
    it("returns job row without userId check", async () => {
      const row = { id: "job-1", userId: "user-1", status: "processing" };
      const db = createMockDb();
      db.query.jobs.findFirst.mockResolvedValue(row);
      const repo = new JobsDbRepository(db as never);

      const result = await repo.getJobByWorker("job-1");

      expect(result).toEqual(row);
      expect(db.query.jobs.findFirst).toHaveBeenCalledOnce();
    });

    it("returns null when not found", async () => {
      const db = createMockDb();
      db.query.jobs.findFirst.mockResolvedValue(undefined);
      const repo = new JobsDbRepository(db as never);

      const result = await repo.getJobByWorker("job-1");

      expect(result).toBeNull();
    });
  });

  describe("updateJobStatus", () => {
    it("calls db.update with status and null error", async () => {
      const whereMock = vi.fn().mockResolvedValue(undefined);
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      const updateMock = vi.fn().mockReturnValue({ set: setMock });
      const db = { update: updateMock } as never;
      const repo = new JobsDbRepository(db);

      await repo.updateJobStatus("job-1", "processing");

      expect(updateMock).toHaveBeenCalledOnce();
      const calledWith = setMock.mock.calls[0][0];
      expect(calledWith.status).toBe("processing");
      expect(calledWith.error).toBeNull();
      expect(calledWith.updatedAt).toBeUndefined();
      expect(whereMock).toHaveBeenCalledOnce();
    });

    it("passes error string when provided", async () => {
      const whereMock = vi.fn().mockResolvedValue(undefined);
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      const db = {
        update: vi.fn().mockReturnValue({ set: setMock }),
      } as never;
      const repo = new JobsDbRepository(db);

      await repo.updateJobStatus("job-1", "failed", "Something went wrong");

      const calledWith = setMock.mock.calls[0][0];
      expect(calledWith.status).toBe("failed");
      expect(calledWith.error).toBe("Something went wrong");
    });

    it("propagates db error", async () => {
      const db = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(new Error("DB error")),
          }),
        }),
      } as never;
      const repo = new JobsDbRepository(db);

      await expect(repo.updateJobStatus("job-1", "failed")).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("updateJobResult", () => {
    it("calls db.update with result", async () => {
      const whereMock = vi.fn().mockResolvedValue(undefined);
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      const updateMock = vi.fn().mockReturnValue({ set: setMock });
      const db = { update: updateMock } as never;
      const repo = new JobsDbRepository(db);

      const result = { completedOpIndices: [0, 1], createdPlaylistId: "pl-1" };
      await repo.updateJobResult("job-1", result);

      expect(updateMock).toHaveBeenCalledOnce();
      const calledWith = setMock.mock.calls[0][0];
      expect(calledWith.result).toEqual(result);
      expect(calledWith.updatedAt).toBeUndefined();
      expect(whereMock).toHaveBeenCalledOnce();
    });

    it("propagates db error", async () => {
      const db = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(new Error("DB error")),
          }),
        }),
      } as never;
      const repo = new JobsDbRepository(db);

      await expect(
        repo.updateJobResult("job-1", { completedOpIndices: [] }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("completeAndCheckOperation", () => {
    it("returns { completed: false } when opIndex is duplicate (no rows updated)", async () => {
      const db = createMockDb();
      db.execute.mockResolvedValue([]);
      const repo = new JobsDbRepository(db as never);

      // 並列呼び出しでの重複 opIndex は atomic SQL で無視される
      const result = await repo.completeAndCheckOperation("job-1", 1);

      expect(result).toEqual({ completed: false });
      expect(db.execute).toHaveBeenCalledOnce();
    });

    it("returns { completed: false } when operation added but job not yet complete", async () => {
      const db = createMockDb();
      db.execute.mockResolvedValue([{ status: "processing" }]);
      const repo = new JobsDbRepository(db as never);

      const result = await repo.completeAndCheckOperation("job-1", 0);

      expect(result).toEqual({ completed: false });
    });

    it("returns { completed: true } when last opIndex completes the job", async () => {
      const db = createMockDb();
      db.execute.mockResolvedValue([{ status: "completed" }]);
      const repo = new JobsDbRepository(db as never);

      const result = await repo.completeAndCheckOperation("job-1", 2);

      expect(result).toEqual({ completed: true });
    });

    it("propagates db error", async () => {
      const db = createMockDb();
      db.execute.mockRejectedValue(new Error("DB error"));
      const repo = new JobsDbRepository(db as never);

      await expect(repo.completeAndCheckOperation("job-1", 0)).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("getStaleJobs", () => {
    it("returns stale job rows using dynamic threshold", async () => {
      const rows = [
        { id: "job-1", status: "processing" },
        { id: "job-2", status: "processing" },
      ];
      const db = createMockDb();
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(rows),
        }),
      });
      const repo = new JobsDbRepository(db as never);

      const result = await repo.getStaleJobs();

      expect(result).toEqual(rows);
    });

    it("propagates db error", async () => {
      const db = createMockDb();
      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      });
      const repo = new JobsDbRepository(db as never);

      await expect(repo.getStaleJobs()).rejects.toThrow("DB error");
    });
  });
});
