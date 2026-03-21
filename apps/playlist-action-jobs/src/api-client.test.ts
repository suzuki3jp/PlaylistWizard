import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createApiClient,
  isRateLimitError,
  isServerError,
} from "./api-client";
import type { Env } from "./types";

function makeEnv(): Env {
  return {
    PLAYLIST_QUEUE: {} as Queue<never>,
    WORKER_SECRET: "test-secret",
    NEXT_APP_URL: "http://localhost:3000",
    SENTRY_DSN: "",
  };
}

function makeJobResponse() {
  return {
    id: "job-1",
    type: "copy",
    status: "pending",
    progress: 0,
    result: null,
    error: null,
    accId: "acc-1",
    operations: [],
  };
}

describe("ApiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends WORKER_SECRET as Bearer token in Authorization header", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeJobResponse()),
    } as Response);

    const env = makeEnv();
    const api = createApiClient(env);
    await api.getJob("job-1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/jobs/job-1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-secret",
        }),
      }),
    );
  });

  it("throws ApiError on HTTP error response", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const env = makeEnv();
    const api = createApiClient(env);
    await expect(api.getJob("not-found")).rejects.toThrow(ApiError);
    await expect(api.getJob("not-found")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("429 → isRateLimitError returns true", () => {
    const err = new ApiError(429, "rate limit");
    expect(isRateLimitError(err)).toBe(true);
    expect(isRateLimitError(new ApiError(500, "server error"))).toBe(false);
  });

  it("500 → isServerError returns true", () => {
    const err = new ApiError(500, "server error");
    expect(isServerError(err)).toBe(true);
    expect(isServerError(new ApiError(429, "rate limit"))).toBe(false);
  });
});
