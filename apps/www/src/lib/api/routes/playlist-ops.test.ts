import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/user", () => ({
  getAccessTokenByAccId: vi.fn(),
}));

vi.mock("@/repository/db/jobs/repository", () => ({
  jobsDbRepository: {
    getJobByWorker: vi.fn(),
    completeAndCheckOperation: vi.fn(),
  },
}));

vi.mock("@/repository/db/user/repository", () => ({
  userDbRepository: {
    findAccountsByUserId: vi.fn(),
  },
}));

vi.mock("@/repository/v2/youtube/repository", () => ({
  YouTubeRepository: vi.fn(),
}));

import { toAccountId } from "@/entities/ids";
import { getAccessTokenByAccId } from "@/lib/user";
import { jobsDbRepository } from "@/repository/db/jobs/repository";
import { userDbRepository } from "@/repository/db/user/repository";
import { YouTubeRepository } from "@/repository/v2/youtube/repository";
import { playlistOpsRouter } from "./playlist-ops";

const app = new Hono().route("/playlist-ops", playlistOpsRouter);
const WORKER_SECRET = "test-secret";

beforeEach(() => {
  process.env.WORKER_SECRET = WORKER_SECRET;
  vi.clearAllMocks();
});

afterEach(() => {
  delete process.env.WORKER_SECRET;
});

const authHeaders = {
  Authorization: `Bearer ${WORKER_SECRET}`,
  "Content-Type": "application/json",
};

const mockJob = {
  id: "job-1",
  userId: "user-1",
  accId: "acc-1",
  totalOpCount: 3,
  result: { completedOpIndices: [] },
};

function setupOwnershipMocks() {
  vi.mocked(jobsDbRepository.getJobByWorker).mockResolvedValue(
    mockJob as never,
  );
  vi.mocked(userDbRepository.findAccountsByUserId).mockResolvedValue([
    {
      id: toAccountId("acc-1"),
      providerId: "google",
      accountId: "google-1" as never,
      scope: null,
    },
  ]);
  vi.mocked(getAccessTokenByAccId).mockResolvedValue("token");
}

describe("playlist-ops: auth", () => {
  it("returns 401 without WORKER_SECRET", async () => {
    const res = await app.request("/playlist-ops/create-playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });
});

describe("POST /playlist-ops/create-playlist", () => {
  it("returns 403 when accId does not belong to job owner", async () => {
    vi.mocked(jobsDbRepository.getJobByWorker).mockResolvedValue(
      mockJob as never,
    );
    vi.mocked(userDbRepository.findAccountsByUserId).mockResolvedValue([
      {
        id: toAccountId("acc-other"),
        providerId: "google",
        accountId: "g" as never,
        scope: null,
      },
    ]);

    const res = await app.request("/playlist-ops/create-playlist", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        jobId: "job-1",
        accId: "acc-1",
        opIndex: 0,
        title: "Test",
        privacy: "private",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("creates playlist and returns playlistId", async () => {
    setupOwnershipMocks();
    const mockRepo = {
      addPlaylist: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: { id: "pl-new" },
      }),
    };
    vi.mocked(YouTubeRepository).mockImplementation(() => mockRepo as never);
    vi.mocked(jobsDbRepository.completeAndCheckOperation).mockResolvedValue({
      completed: false,
    });

    const res = await app.request("/playlist-ops/create-playlist", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        jobId: "job-1",
        accId: "acc-1",
        opIndex: 0,
        title: "Test",
        privacy: "private",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.playlistId).toBe("pl-new");
    expect(
      vi.mocked(jobsDbRepository.completeAndCheckOperation),
    ).toHaveBeenCalledWith("job-1", 0);
  });

  it("returns 500 with youtube-api-error on YouTube API failure", async () => {
    setupOwnershipMocks();
    const mockRepo = {
      addPlaylist: vi.fn().mockResolvedValue({
        isErr: () => true,
        error: new Error("YouTube quota exceeded"),
      }),
    };
    vi.mocked(YouTubeRepository).mockImplementation(() => mockRepo as never);

    const res = await app.request("/playlist-ops/create-playlist", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        jobId: "job-1",
        accId: "acc-1",
        opIndex: 0,
        title: "Test",
        privacy: "private",
      }),
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("youtube-api-error");
  });
});

describe("POST /playlist-ops/add-playlist-item", () => {
  it("adds item and returns ok", async () => {
    setupOwnershipMocks();
    const mockRepo = {
      addPlaylistItem: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: {},
      }),
    };
    vi.mocked(YouTubeRepository).mockImplementation(() => mockRepo as never);
    vi.mocked(jobsDbRepository.completeAndCheckOperation).mockResolvedValue({
      completed: false,
    });

    const res = await app.request("/playlist-ops/add-playlist-item", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        jobId: "job-1",
        accId: "acc-1",
        opIndex: 0,
        playlistId: "pl-1",
        videoId: "v-1",
      }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("POST /playlist-ops/remove-playlist-item", () => {
  it("removes item and returns ok", async () => {
    setupOwnershipMocks();
    const mockRepo = {
      removePlaylistItem: vi.fn().mockResolvedValue({
        isErr: () => false,
      }),
    };
    vi.mocked(YouTubeRepository).mockImplementation(() => mockRepo as never);
    vi.mocked(jobsDbRepository.completeAndCheckOperation).mockResolvedValue({
      completed: false,
    });

    const res = await app.request("/playlist-ops/remove-playlist-item", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        jobId: "job-1",
        accId: "acc-1",
        opIndex: 0,
        playlistItemId: "item-1",
      }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("POST /playlist-ops/update-playlist-item-position", () => {
  it("updates position and returns ok", async () => {
    setupOwnershipMocks();
    const mockRepo = {
      updatePlaylistItemPosition: vi.fn().mockResolvedValue({
        isErr: () => false,
        value: {},
      }),
    };
    vi.mocked(YouTubeRepository).mockImplementation(() => mockRepo as never);
    vi.mocked(jobsDbRepository.completeAndCheckOperation).mockResolvedValue({
      completed: false,
    });

    const res = await app.request(
      "/playlist-ops/update-playlist-item-position",
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          jobId: "job-1",
          accId: "acc-1",
          opIndex: 0,
          playlistId: "pl-1",
          playlistItemId: "item-1",
          resourceId: "v-1",
          position: 3,
        }),
      },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
