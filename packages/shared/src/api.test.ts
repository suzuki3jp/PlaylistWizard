import { describe, expect, it } from "vitest";
import {
  API_AUTH_BASE_PATH,
  API_JOB_PROGRESS_PATH,
  API_JOBS_BASE_PATH,
  API_V1_BASE_PATH,
  resolveApiUrl,
} from "./api";

describe("API URL contract", () => {
  it("derives every public path from the v1 prefix", () => {
    expect(API_AUTH_BASE_PATH).toBe(`${API_V1_BASE_PATH}/api/auth`);
    expect(API_JOBS_BASE_PATH).toBe(`${API_V1_BASE_PATH}/jobs`);
    expect(API_JOB_PROGRESS_PATH).toBe(`${API_JOBS_BASE_PATH}/progress`);
  });

  it("resolves paths against an origin with or without a trailing slash", () => {
    expect(resolveApiUrl("https://api.example.com", API_JOBS_BASE_PATH)).toBe(
      "https://api.example.com/v1/jobs",
    );
    expect(resolveApiUrl("https://api.example.com/", API_AUTH_BASE_PATH)).toBe(
      "https://api.example.com/v1/api/auth",
    );
  });
});
