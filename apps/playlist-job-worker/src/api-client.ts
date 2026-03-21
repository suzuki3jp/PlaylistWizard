import type {
  JobOperation,
  JobResult,
  JobStatus,
} from "@playlistwizard/job-queue";
import type { Env } from "./types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Worker 向け GET /api/v1/jobs/:id のレスポンス型（operationsを含む）
export type WorkerJobResponse = {
  id: string;
  type: string;
  status: JobStatus;
  progress: number;
  result: JobResult | null;
  error: string | null;
  accId: string;
  operations: JobOperation[];
};

export type CreatePlaylistOpBody = {
  jobId: string;
  accId: string;
  opIndex: number;
  title: string;
  privacy: "public" | "private" | "unlisted";
};

export type AddPlaylistItemOpBody = {
  jobId: string;
  accId: string;
  opIndex: number;
  playlistId: string;
  videoId: string;
};

export type RemovePlaylistItemOpBody = {
  jobId: string;
  accId: string;
  opIndex: number;
  playlistItemId: string;
};

export type UpdatePlaylistItemPositionOpBody = {
  jobId: string;
  accId: string;
  opIndex: number;
  playlistId: string;
  playlistItemId: string;
  resourceId: string;
  position: number;
};

async function request(
  url: string,
  env: Env,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.WORKER_SECRET}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}: ${url}`);
  }
  return res;
}

export function createApiClient(env: Env) {
  const base = env.NEXT_APP_URL;

  return {
    async getJob(jobId: string): Promise<WorkerJobResponse> {
      const res = await request(`${base}/api/v1/jobs/${jobId}`, env);
      return res.json<WorkerJobResponse>();
    },

    async getStaleJobs(): Promise<WorkerJobResponse[]> {
      const res = await request(`${base}/api/v1/jobs/stale`, env);
      return res.json<WorkerJobResponse[]>();
    },

    async updateJobStatus(
      jobId: string,
      status: JobStatus,
      error?: string,
    ): Promise<void> {
      await request(`${base}/api/v1/jobs/${jobId}/status`, env, {
        method: "PATCH",
        body: JSON.stringify({ status, ...(error ? { error } : {}) }),
      });
    },

    async createPlaylist(
      body: CreatePlaylistOpBody,
    ): Promise<{ playlistId: string }> {
      const res = await request(
        `${base}/api/v1/playlist-ops/create-playlist`,
        env,
        { method: "POST", body: JSON.stringify(body) },
      );
      return res.json<{ playlistId: string }>();
    },

    async addPlaylistItem(body: AddPlaylistItemOpBody): Promise<void> {
      await request(`${base}/api/v1/playlist-ops/add-playlist-item`, env, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    async removePlaylistItem(body: RemovePlaylistItemOpBody): Promise<void> {
      await request(`${base}/api/v1/playlist-ops/remove-playlist-item`, env, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    async updatePlaylistItemPosition(
      body: UpdatePlaylistItemPositionOpBody,
    ): Promise<void> {
      await request(
        `${base}/api/v1/playlist-ops/update-playlist-item-position`,
        env,
        { method: "POST", body: JSON.stringify(body) },
      );
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function isRateLimitError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 429;
}

export function isServerError(err: unknown): boolean {
  return err instanceof ApiError && err.status >= 500;
}
