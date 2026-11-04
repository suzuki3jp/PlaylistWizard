import {
  type BackendJob,
  JobStatus,
  JobType,
} from "@playlistwizard/playlist-action-job";
import { describe, expect, it } from "vitest";
import { getPlaylistRefreshScope } from "./tasks-monitor";

const job = (
  type: BackendJob["type"],
  status: BackendJob["status"],
): BackendJob => ({
  completeSteps: 0,
  id: "job-id",
  status,
  totalSteps: 0,
  type,
});

describe("getPlaylistRefreshScope", () => {
  it("refreshes every Account after a Sync Job stops, including partial failures", () => {
    expect(
      getPlaylistRefreshScope(job(JobType.Sync, JobStatus.Completed)),
    ).toBe("all-accounts");
    expect(getPlaylistRefreshScope(job(JobType.Sync, JobStatus.Failed))).toBe(
      "all-accounts",
    );
  });

  it("does not refresh while a Sync Job is still active", () => {
    expect(
      getPlaylistRefreshScope(job(JobType.Sync, JobStatus.Pending)),
    ).toBeNull();
    expect(
      getPlaylistRefreshScope(job(JobType.Sync, JobStatus.Running)),
    ).toBeNull();
  });

  it("refreshes the focused Account only after a Create Job completes", () => {
    expect(
      getPlaylistRefreshScope(job(JobType.Create, JobStatus.Completed)),
    ).toBe("focused-account");
    expect(
      getPlaylistRefreshScope(job(JobType.Create, JobStatus.Failed)),
    ).toBeNull();
  });
});
