import { toUserId } from "@playlistwizard/core/ids";
import { JobStatus, toJobId } from "@playlistwizard/playlist-action-job";
import { describe, expect, it, vi } from "vitest";
import { createDismissPlaylistActionJobsUsecase } from "./dismiss-playlist-action-jobs";
import type {
  JobProgressPublisher,
  PlaylistActionJobRepository,
} from "./ports";

const userId = toUserId("user-id");
const jobId = toJobId("job-id");

const createDeps = (overrides?: {
  publishError?: Error;
  statuses?: Awaited<
    ReturnType<PlaylistActionJobRepository["findJobStatusesForUser"]>
  >;
}) => {
  const jobs = {
    dismissJobs: vi.fn(async (input) => input.jobIds),
    findJobStatusesForUser: vi.fn(
      async () =>
        overrides?.statuses ?? [{ id: jobId, status: JobStatus.Completed }],
    ),
  } as unknown as PlaylistActionJobRepository;
  const progressPublisher: JobProgressPublisher = {
    publishRemoved: vi.fn(async () => {
      if (overrides?.publishError) throw overrides.publishError;
    }),
    publishUpdated: vi.fn(async () => undefined),
  };

  return { jobs, progressPublisher };
};

describe("createDismissPlaylistActionJobsUsecase", () => {
  it("dismisses terminal jobs and publishes removal events", async () => {
    const deps = createDeps();
    const usecase = createDismissPlaylistActionJobsUsecase(deps);

    await expect(usecase({ jobIds: [jobId], userId })).resolves.toEqual({
      jobIds: ["job-id"],
      type: "dismissed",
    });

    expect(deps.jobs.dismissJobs).toHaveBeenCalledWith({
      jobIds: [jobId],
      userId,
    });
    expect(deps.progressPublisher.publishRemoved).toHaveBeenCalledWith({
      jobId: "job-id",
      userId,
    });
  });

  it("rejects active jobs before updating dismissal state", async () => {
    const deps = createDeps({
      statuses: [{ id: jobId, status: JobStatus.Running }],
    });
    const usecase = createDismissPlaylistActionJobsUsecase(deps);

    await expect(usecase({ jobIds: [jobId], userId })).resolves.toEqual({
      jobIds: ["job-id"],
      type: "active_jobs",
    });

    expect(deps.jobs.dismissJobs).not.toHaveBeenCalled();
    expect(deps.progressPublisher.publishRemoved).not.toHaveBeenCalled();
  });

  it("keeps dismissal successful when removal publishing fails", async () => {
    const deps = createDeps({ publishError: new Error("publish failed") });
    const usecase = createDismissPlaylistActionJobsUsecase(deps);

    await expect(usecase({ jobIds: [jobId], userId })).resolves.toEqual({
      jobIds: ["job-id"],
      type: "dismissed",
    });
  });
});
