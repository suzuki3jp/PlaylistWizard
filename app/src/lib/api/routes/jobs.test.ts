import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// モック設定
vi.mock("@/lib/user", () => ({
  getSessionUser: vi.fn(),
  getAccessToken: vi.fn(),
}));

vi.mock("@/repository/db/jobs/repository", () => ({
  jobsDbRepository: {
    createJob: vi.fn(),
    getJob: vi.fn(),
    getJobByWorker: vi.fn(),
    updateJobStatus: vi.fn(),
    updateJobResult: vi.fn(),
    completeOperation: vi.fn(),
    getStaleJobs: vi.fn(),
  },
}));

vi.mock("@/lib/api/compute-operations", () => ({
  computeOperations: vi.fn(),
}));

vi.mock("@/lib/queue", () => ({
  enqueueMessages: vi.fn(),
}));

vi.mock("@/repository/v2/youtube/repository", () => ({
  YouTubeRepository: vi.fn(),
}));

import { computeOperations } from "@/lib/api/compute-operations";
import { enqueueMessages } from "@/lib/queue";
import { getAccessToken, getSessionUser } from "@/lib/user";
import { jobsDbRepository } from "@/repository/db/jobs/repository";
import { YouTubeRepository } from "@/repository/v2/youtube/repository";
import { jobsRouter } from "./jobs";

const app = new Hono().route("/jobs", jobsRouter);

const WORKER_SECRET = "test-secret";

beforeEach(() => {
  process.env.WORKER_SECRET = WORKER_SECRET;
  vi.clearAllMocks();
});

afterEach(() => {
  delete process.env.WORKER_SECRET;
});

const mockUser = {
  id: "user-1",
  name: "Test",
  email: "test@example.com",
  image: null,
  providers: [
    { id: "acc-1", providerId: "google", accountId: "google-1", scopes: [] },
  ],
};

const mockJob = {
  id: "job-1",
  userId: "user-1",
  accId: "acc-1",
  type: "deduplicate",
  status: "pending",
  payload: { operations: [] },
  totalOpCount: 3,
  progress: 0,
  result: { completedOpIndices: [0, 1] },
  error: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("POST /jobs", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const res = await app.request("/jobs", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid request body", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    const res = await app.request("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "invalid" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 403 when accId does not belong to user", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    const res = await app.request("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "deduplicate",
        accId: "other-acc",
        targetPlaylistId: "pl-1",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 201 with jobId on success (deduplicate, no create-playlist)", async () => {
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
    vi.mocked(computeOperations).mockResolvedValue([
      {
        opIndex: 0,
        type: "remove-playlist-item",
        accId: "acc-1",
        playlistItemId: "item-1",
      },
    ]);
    vi.mocked(jobsDbRepository.createJob).mockResolvedValue({
      id: "job-new",
    } as never);
    vi.mocked(enqueueMessages).mockResolvedValue(undefined);

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
    expect(body.jobId).toBe("job-new");
    expect(enqueueMessages).toHaveBeenCalledWith([
      expect.objectContaining({
        jobId: "job-new",
        type: "remove-playlist-item",
      }),
    ]);
  });

  it("enqueues only create-playlist op when operations include create-playlist", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(getAccessToken).mockResolvedValue("token");
    vi.mocked(computeOperations).mockResolvedValue([
      {
        opIndex: 0,
        type: "create-playlist",
        accId: "acc-1",
        title: "New",
        privacy: "private",
      },
      {
        opIndex: 1,
        type: "add-playlist-item",
        accId: "acc-1",
        playlistId: null,
        videoId: "v1",
      },
    ]);
    vi.mocked(jobsDbRepository.createJob).mockResolvedValue({
      id: "job-2",
    } as never);
    vi.mocked(enqueueMessages).mockResolvedValue(undefined);

    const res = await app.request("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "copy",
        accId: "acc-1",
        sourcePlaylistId: "src-1",
      }),
    });

    expect(res.status).toBe(201);
    // create-playlist のみエンキューされていること
    const calls = vi.mocked(enqueueMessages).mock.calls[0][0];
    expect(calls).toHaveLength(1);
    expect(calls[0].type).toBe("create-playlist");
  });
});

describe("GET /jobs/stale", () => {
  it("returns 401 without WORKER_SECRET", async () => {
    const res = await app.request("/jobs/stale", {
      headers: { Authorization: "Bearer wrong" },
    });
    expect(res.status).toBe(401);
  });

  it("returns stale jobs with valid WORKER_SECRET", async () => {
    vi.mocked(jobsDbRepository.getStaleJobs).mockResolvedValue([
      mockJob as never,
    ]);
    const res = await app.request("/jobs/stale", {
      headers: { Authorization: `Bearer ${WORKER_SECRET}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("job-1");
  });
});

describe("GET /jobs/:id", () => {
  it("returns job for authenticated user (owner)", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(jobsDbRepository.getJob).mockResolvedValue(mockJob as never);

    const res = await app.request("/jobs/job-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("job-1");
    // progress は completedOpIndices.length / totalOpCount * 100 = 2/3 * 100 = 67
    expect(body.progress).toBe(67);
  });

  it("returns 401 when not authenticated and no WORKER_SECRET", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const res = await app.request("/jobs/job-1");
    expect(res.status).toBe(401);
  });

  it("returns 404 when job not found", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(jobsDbRepository.getJob).mockResolvedValue(null);
    const res = await app.request("/jobs/job-1");
    expect(res.status).toBe(404);
  });

  it("allows WORKER_SECRET access", async () => {
    vi.mocked(jobsDbRepository.getJobByWorker).mockResolvedValue(
      mockJob as never,
    );
    const res = await app.request("/jobs/job-1", {
      headers: { Authorization: `Bearer ${WORKER_SECRET}` },
    });
    expect(res.status).toBe(200);
  });
});

describe("PATCH /jobs/:id/cancel", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const res = await app.request("/jobs/job-1/cancel", { method: "PATCH" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when job not found", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(jobsDbRepository.getJob).mockResolvedValue(null);
    const res = await app.request("/jobs/job-1/cancel", { method: "PATCH" });
    expect(res.status).toBe(404);
  });

  it("returns 409 when job is already completed", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(jobsDbRepository.getJob).mockResolvedValue({
      ...mockJob,
      status: "completed",
    } as never);
    const res = await app.request("/jobs/job-1/cancel", { method: "PATCH" });
    expect(res.status).toBe(409);
  });

  it("cancels pending job", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(jobsDbRepository.getJob).mockResolvedValue({
      ...mockJob,
      status: "pending",
    } as never);
    vi.mocked(jobsDbRepository.updateJobStatus).mockResolvedValue(undefined);
    const res = await app.request("/jobs/job-1/cancel", { method: "PATCH" });
    expect(res.status).toBe(200);
    expect(vi.mocked(jobsDbRepository.updateJobStatus)).toHaveBeenCalledWith(
      "job-1",
      "cancelled",
    );
  });
});

describe("PATCH /jobs/:id/status (worker internal)", () => {
  it("returns 401 without WORKER_SECRET", async () => {
    const res = await app.request("/jobs/job-1/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "processing" }),
    });
    expect(res.status).toBe(401);
  });

  it("updates job status with valid secret", async () => {
    vi.mocked(jobsDbRepository.updateJobStatus).mockResolvedValue(undefined);
    const res = await app.request("/jobs/job-1/status", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${WORKER_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "processing" }),
    });
    expect(res.status).toBe(200);
    expect(vi.mocked(jobsDbRepository.updateJobStatus)).toHaveBeenCalledWith(
      "job-1",
      "processing",
      undefined,
    );
  });
});

describe("PATCH /jobs/:id/complete-op (worker internal)", () => {
  it("completes operation and checks job completion", async () => {
    vi.mocked(jobsDbRepository.completeOperation).mockResolvedValue(undefined);
    vi.mocked(jobsDbRepository.getJobByWorker).mockResolvedValue({
      ...mockJob,
      result: { completedOpIndices: [0, 1, 2] },
      totalOpCount: 3,
    } as never);
    vi.mocked(jobsDbRepository.updateJobStatus).mockResolvedValue(undefined);

    const res = await app.request("/jobs/job-1/complete-op", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${WORKER_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ opIndex: 2 }),
    });

    expect(res.status).toBe(200);
    expect(vi.mocked(jobsDbRepository.updateJobStatus)).toHaveBeenCalledWith(
      "job-1",
      "completed",
    );
  });
});
