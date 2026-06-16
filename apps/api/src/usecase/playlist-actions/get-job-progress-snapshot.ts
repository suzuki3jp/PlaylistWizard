import type { UserId } from "@playlistwizard/core/ids";
import {
  createJobProgressSnapshotEvent,
  serializeJobProgressEvent,
} from "@playlistwizard/playlist-action-job";
import type { PlaylistActionJobRepository } from "./ports";

export const createGetJobProgressSnapshotUsecase = (deps: {
  jobs: PlaylistActionJobRepository;
}) => {
  return async (userId: UserId): Promise<string> => {
    const jobs =
      await deps.jobs.findSanitizedJobProgressSummariesForUser(userId);

    return serializeJobProgressEvent(createJobProgressSnapshotEvent(jobs));
  };
};
