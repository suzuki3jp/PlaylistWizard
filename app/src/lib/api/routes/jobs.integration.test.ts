import { Hono } from "hono";
import { ok } from "neverthrow";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("server-only", () => ({}));

// テスト DB で @/lib/db を差し替える（jobsDbRepository シングルトンが使うモジュール）
vi.mock("@/lib/db", async () => {
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const postgres = (await import("postgres")).default;
  const schema = await import("@/lib/db/schema");
  const url =
    process.env.TEST_DATABASE_URL ??
    "postgresql://test:test@localhost:5433/playlistwizard_test";
  const client = postgres(url, { prepare: false });
  return { db: drizzle(client, { schema }) };
});

vi.mock("@/lib/user", () => ({
  getSessionUser: vi.fn(),
  getAccessToken: vi.fn(),
}));

vi.mock("@/lib/api/compute-operations", () => ({
  computeOperations: vi.fn(),
}));

vi.mock("@/repository/queue/repository", () => ({
  queueRepository: { enqueue: vi.fn() },
}));

vi.mock("@/repository/v2/youtube/repository", () => ({
  YouTubeRepository: vi.fn(),
}));

import { computeOperations } from "@/lib/api/compute-operations";
import * as dbSchema from "@/lib/db/schema";
import { getAccessToken, getSessionUser } from "@/lib/user";
import { jobsDbRepository } from "@/repository/db/jobs/repository";
import { queueRepository } from "@/repository/queue/repository";
import { YouTubeRepository } from "@/repository/v2/youtube/repository";
import {
  cleanupTestData,
  closeTestDb,
  getTestDb,
  insertTestUser,
  runMigrations,
} from "@/test/integration/db";
import { jobsRouter } from "./jobs";

const app = new Hono().route("/jobs", jobsRouter);

const WORKER_SECRET = "test-secret";
let testUserId: string;

const mockUser = {
  id: "placeholder",
  name: "Test User",
  email: "test@example.com",
  image: null,
  providers: [
    { id: "acc-1", providerId: "google", accountId: "google-1", scopes: [] },
  ],
};

beforeAll(async () => {
  await runMigrations();
  testUserId = await insertTestUser(getTestDb());
  mockUser.id = testUserId;
  process.env.WORKER_SECRET = WORKER_SECRET;
});

afterEach(async () => {
  const testDb = getTestDb();
  await testDb.delete(dbSchema.jobs);
  vi.clearAllMocks();
});

afterAll(async () => {
  await cleanupTestData(getTestDb());
  await closeTestDb();
  delete process.env.WORKER_SECRET;
});

describe("POST /jobs (integration)", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const res = await app.request("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "deduplicate",
        accId: "acc-1",
        targetPlaylistId: "pl-1",
      }),
    });

    expect(res.status).toBe(401);
  });

  it("returns 201 and inserts a row into jobs table", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(getAccessToken).mockResolvedValue("token");
    vi.mocked(YouTubeRepository).mockImplementation(
      () =>
        ({
          getMyPlaylists: vi
            .fn()
            .mockResolvedValue({ isErr: () => false, value: [{ id: "pl-1" }] }),
        }) as never,
    );
    vi.mocked(computeOperations).mockResolvedValue(
      ok([
        {
          opIndex: 0,
          type: "remove-playlist-item" as const,
          accId: "acc-1",
          playlistItemId: "item-1",
        },
      ]),
    );
    vi.mocked(queueRepository.enqueue).mockResolvedValue(undefined);

    const res = await app.request("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "deduplicate",
        accId: "acc-1",
        targetPlaylistId: "pl-1",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.jobId).toBeTruthy();

    // DB に行が存在することを確認
    const job = await jobsDbRepository.getJob(body.jobId);
    expect(job).not.toBeNull();
    expect(job?.status).toBe("pending");
    expect(job?.totalOpCount).toBe(1);
  });
});

describe("GET /jobs/:id (integration)", () => {
  it("returns job for authenticated owner", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(getAccessToken).mockResolvedValue("token");
    vi.mocked(YouTubeRepository).mockImplementation(
      () =>
        ({
          getMyPlaylists: vi
            .fn()
            .mockResolvedValue({ isErr: () => false, value: [{ id: "pl-1" }] }),
        }) as never,
    );
    vi.mocked(computeOperations).mockResolvedValue(
      ok([
        {
          opIndex: 0,
          type: "remove-playlist-item" as const,
          accId: "acc-1",
          playlistItemId: "item-1",
        },
      ]),
    );
    vi.mocked(queueRepository.enqueue).mockResolvedValue(undefined);

    const createRes = await app.request("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "deduplicate",
        accId: "acc-1",
        targetPlaylistId: "pl-1",
      }),
    });
    const { jobId } = await createRes.json();

    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);

    const res = await app.request(`/jobs/${jobId}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(jobId);
    expect(data.status).toBe("pending");
  });

  it("returns 404 for non-existent job", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);

    const res = await app.request("/jobs/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
  });
});

describe("PATCH /jobs/:id/cancel (integration)", () => {
  it("cancels a pending job", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(getAccessToken).mockResolvedValue("token");
    vi.mocked(YouTubeRepository).mockImplementation(
      () =>
        ({
          getMyPlaylists: vi
            .fn()
            .mockResolvedValue({ isErr: () => false, value: [{ id: "pl-1" }] }),
        }) as never,
    );
    vi.mocked(computeOperations).mockResolvedValue(
      ok([
        {
          opIndex: 0,
          type: "remove-playlist-item" as const,
          accId: "acc-1",
          playlistItemId: "item-1",
        },
      ]),
    );
    vi.mocked(queueRepository.enqueue).mockResolvedValue(undefined);

    const createRes = await app.request("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "deduplicate",
        accId: "acc-1",
        targetPlaylistId: "pl-1",
      }),
    });
    const { jobId } = await createRes.json();

    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);

    const res = await app.request(`/jobs/${jobId}/cancel`, { method: "PATCH" });
    expect(res.status).toBe(200);

    const job = await jobsDbRepository.getJob(jobId);
    expect(job?.status).toBe("cancelled");
  });

  it("returns 409 when job is already completed", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(getAccessToken).mockResolvedValue("token");
    vi.mocked(YouTubeRepository).mockImplementation(
      () =>
        ({
          getMyPlaylists: vi
            .fn()
            .mockResolvedValue({ isErr: () => false, value: [{ id: "pl-1" }] }),
        }) as never,
    );
    vi.mocked(computeOperations).mockResolvedValue(
      ok([
        {
          opIndex: 0,
          type: "remove-playlist-item" as const,
          accId: "acc-1",
          playlistItemId: "item-1",
        },
      ]),
    );
    vi.mocked(queueRepository.enqueue).mockResolvedValue(undefined);

    const createRes = await app.request("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "deduplicate",
        accId: "acc-1",
        targetPlaylistId: "pl-1",
      }),
    });
    const { jobId } = await createRes.json();

    // 完了状態に更新
    await jobsDbRepository.updateJobStatus(jobId, "completed");

    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);

    const res = await app.request(`/jobs/${jobId}/cancel`, { method: "PATCH" });
    expect(res.status).toBe(409);
  });
});
