import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { UserId } from "@/entities/ids";
import { toUserId } from "@/entities/ids";
import {
  cleanupTestData,
  closeTestDb,
  getTestDb,
  insertTestUser,
  runMigrations,
} from "@/test/integration/db";
import { JobsDbRepository } from "./repository";

let testUserId: string;
let repo: JobsDbRepository;

beforeAll(async () => {
  const testDb = getTestDb();
  await runMigrations();
  testUserId = await insertTestUser(testDb);
  repo = new JobsDbRepository(testDb);
});

afterEach(async () => {
  const testDb = getTestDb();
  await testDb.delete((await import("@/lib/db/schema")).jobs);
});

afterAll(async () => {
  await cleanupTestData(getTestDb());
  await closeTestDb();
});

const baseJobData = {
  userId: "placeholder" as UserId,
  accId: "acc-1",
  type: "deduplicate" as const,
  operations: [
    {
      opIndex: 0,
      type: "remove-playlist-item" as const,
      accId: "acc-1",
      playlistItemId: "item-1",
    },
    {
      opIndex: 1,
      type: "remove-playlist-item" as const,
      accId: "acc-1",
      playlistItemId: "item-2",
    },
  ],
  totalOpCount: 2,
};

describe("JobsDbRepository (integration)", () => {
  describe("createJob", () => {
    it("inserts a row and returns it with default status=pending", async () => {
      const job = await repo.createJob({
        ...baseJobData,
        userId: toUserId(testUserId),
      });

      expect(job.id).toBeTruthy();
      expect(job.userId).toBe(testUserId);
      expect(job.accId).toBe("acc-1");
      expect(job.type).toBe("deduplicate");
      expect(job.status).toBe("pending");
      expect(job.totalOpCount).toBe(2);
    });
  });

  describe("getJob", () => {
    it("retrieves job by id without userId filter", async () => {
      const created = await repo.createJob({
        ...baseJobData,
        userId: toUserId(testUserId),
      });

      const found = await repo.getJob(created.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    it("retrieves job by id with userId filter", async () => {
      const created = await repo.createJob({
        ...baseJobData,
        userId: toUserId(testUserId),
      });

      const found = await repo.getJob(created.id, toUserId(testUserId));
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    it("returns null when userId does not match", async () => {
      const created = await repo.createJob({
        ...baseJobData,
        userId: toUserId(testUserId),
      });

      const found = await repo.getJob(created.id, toUserId("other-user-id"));
      expect(found).toBeNull();
    });

    it("returns null when job does not exist", async () => {
      const found = await repo.getJob("00000000-0000-0000-0000-000000000000");
      expect(found).toBeNull();
    });
  });

  describe("updateJobStatus", () => {
    it("updates status to processing", async () => {
      const created = await repo.createJob({
        ...baseJobData,
        userId: toUserId(testUserId),
      });

      await repo.updateJobStatus(created.id, "processing");

      const updated = await repo.getJob(created.id);
      expect(updated?.status).toBe("processing");
      expect(updated?.error).toBeNull();
    });

    it("stores error string when provided", async () => {
      const created = await repo.createJob({
        ...baseJobData,
        userId: toUserId(testUserId),
      });

      await repo.updateJobStatus(created.id, "failed", "Something went wrong");

      const updated = await repo.getJob(created.id);
      expect(updated?.status).toBe("failed");
      expect(updated?.error).toBe("Something went wrong");
    });
  });

  describe("updateJobResult", () => {
    it("stores createdPlaylistId in result", async () => {
      const created = await repo.createJob({
        ...baseJobData,
        userId: toUserId(testUserId),
      });

      await repo.updateJobResult(created.id, {
        completedOpIndices: [],
        createdPlaylistId: "PL-new-123",
      });

      const updated = await repo.getJob(created.id);
      expect(updated?.result?.createdPlaylistId).toBe("PL-new-123");
    });
  });

  describe("completeAndCheckOperation", () => {
    it("appends opIndex to completedOpIndices", async () => {
      const created = await repo.createJob({
        ...baseJobData,
        userId: toUserId(testUserId),
      });

      await repo.completeAndCheckOperation(created.id, 0);
      const after0 = await repo.getJob(created.id);
      expect(after0?.result?.completedOpIndices).toContain(0);

      await repo.completeAndCheckOperation(created.id, 1);
      const after1 = await repo.getJob(created.id);
      expect(after1?.result?.completedOpIndices).toContain(0);
      expect(after1?.result?.completedOpIndices).toContain(1);
    });

    it("ignores duplicate opIndex", async () => {
      const created = await repo.createJob({
        ...baseJobData,
        userId: toUserId(testUserId),
      });

      await repo.completeAndCheckOperation(created.id, 0);
      await repo.completeAndCheckOperation(created.id, 0);

      const updated = await repo.getJob(created.id);
      const indices = updated?.result?.completedOpIndices ?? [];
      expect(indices.filter((i) => i === 0)).toHaveLength(1);
    });

    it("returns { completed: true } when last op completes the job", async () => {
      const created = await repo.createJob({
        ...baseJobData,
        userId: toUserId(testUserId),
        totalOpCount: 1,
      });

      const result = await repo.completeAndCheckOperation(created.id, 0);
      expect(result).toEqual({ completed: true });

      const updated = await repo.getJob(created.id);
      expect(updated?.status).toBe("completed");
    });
  });

  describe("getStaleJobs", () => {
    it("does not return a freshly created pending job", async () => {
      await repo.createJob({
        ...baseJobData,
        userId: toUserId(testUserId),
      });

      const stale = await repo.getStaleJobs();
      expect(stale).toHaveLength(0);
    });
  });
});
