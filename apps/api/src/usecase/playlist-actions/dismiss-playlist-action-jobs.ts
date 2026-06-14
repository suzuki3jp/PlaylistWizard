import type { UserId } from "@playlistwizard/core/ids";
import {
  type JobId,
  JobStatus,
  toJobId,
} from "@playlistwizard/playlist-action-job";
import { publishJobProgressRemoval } from "./job-progress";
import type {
  JobProgressPublisher,
  PlaylistActionJobRepository,
} from "./ports";

export type DismissPlaylistActionJobsCommand = {
  jobIds: string[];
  userId: UserId;
};

export type DismissPlaylistActionJobsResult =
  | { type: "dismissed"; jobIds: string[] }
  | { type: "active_jobs"; jobIds: string[] };

const isTerminalStatus = (status: JobStatus): boolean =>
  status === JobStatus.Completed || status === JobStatus.Failed;

export const createDismissPlaylistActionJobsUsecase = (deps: {
  jobs: PlaylistActionJobRepository;
  progressPublisher: JobProgressPublisher;
}) => {
  return async (
    command: DismissPlaylistActionJobsCommand,
  ): Promise<DismissPlaylistActionJobsResult> => {
    const jobIds = command.jobIds.map(toJobId);
    const statuses = await deps.jobs.findJobStatusesForUser({
      jobIds,
      userId: command.userId,
    });
    const activeJobIds = statuses
      .filter((job) => !isTerminalStatus(job.status))
      .map((job) => job.id);

    if (activeJobIds.length > 0) {
      return { type: "active_jobs", jobIds: activeJobIds };
    }

    const terminalJobIds = statuses
      .filter((job): job is { id: JobId; status: JobStatus } =>
        isTerminalStatus(job.status),
      )
      .map((job) => job.id);
    const dismissedJobIds = await deps.jobs.dismissJobs({
      jobIds: terminalJobIds,
      userId: command.userId,
    });

    await Promise.all(
      dismissedJobIds.map((jobId) =>
        publishJobProgressRemoval(deps, { jobId, userId: command.userId }),
      ),
    );

    return { type: "dismissed", jobIds: dismissedJobIds };
  };
};
