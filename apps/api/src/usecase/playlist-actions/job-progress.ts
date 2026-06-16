import type { JobId } from "@playlistwizard/playlist-action-job";
import type {
  JobProgressPublisher,
  PlaylistActionJobRepository,
} from "./ports";

export const publishJobProgressUpdate = async (
  deps: {
    jobs: PlaylistActionJobRepository;
    progressPublisher: JobProgressPublisher;
  },
  jobId: JobId,
): Promise<void> => {
  const summary = await deps.jobs.findSanitizedJobProgressSummary(jobId);

  if (summary.type !== "found") return;

  try {
    await deps.progressPublisher.publishUpdated({
      job: summary.job,
      userId: summary.userId,
    });
  } catch {
    // Progress delivery is best-effort and must not affect Job execution.
  }
};

export const publishJobProgressRemoval = async (
  deps: {
    progressPublisher: JobProgressPublisher;
  },
  input: Parameters<JobProgressPublisher["publishRemoved"]>[0],
): Promise<void> => {
  try {
    await deps.progressPublisher.publishRemoved(input);
  } catch {
    // Progress delivery is best-effort and must not affect dismissal.
  }
};
