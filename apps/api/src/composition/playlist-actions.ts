import type { QueueLike } from "../env";
import { DrizzleAccountAccess } from "../infrastructure/accounts/drizzle-account-access";
import type { WorkerAuth } from "../infrastructure/auth/better-auth";
import { BetterAuthTokenProvider } from "../infrastructure/auth/better-auth-token-provider";
import type { Db } from "../infrastructure/db/connection";
import { cryptoRandomIdGenerator } from "../infrastructure/id-generator";
import { CloudflareJobProgressPublisher } from "../infrastructure/playlist-action-jobs/cloudflare-job-progress-publisher";
import { DrizzlePlaylistActionJobRepository } from "../infrastructure/playlist-action-jobs/drizzle-playlist-action-job-repository";
import { YouTubePlaylistGateway } from "../infrastructure/provider/youtube/youtube-playlist-gateway";
import { CloudflareStepQueue } from "../infrastructure/queue/cloudflare-step-queue";
import { createCreatePlaylistActionJobUsecase } from "../usecase/playlist-actions/create-playlist-action-job";
import { createDismissPlaylistActionJobsUsecase } from "../usecase/playlist-actions/dismiss-playlist-action-jobs";
import { createGetJobProgressSnapshotUsecase } from "../usecase/playlist-actions/get-job-progress-snapshot";
import {
  createProcessPlaylistActionDlqMessageUsecase,
  createProcessPlaylistActionStepUsecase,
} from "../usecase/playlist-actions/process-playlist-action-step";

export const createPlaylistActionServices = (deps: {
  auth: WorkerAuth;
  db: Db;
  progressStream: DurableObjectNamespace;
  queue: QueueLike;
}) => {
  const accounts = new DrizzleAccountAccess(deps.db);
  const jobs = new DrizzlePlaylistActionJobRepository(deps.db);
  const progressPublisher = new CloudflareJobProgressPublisher(
    deps.progressStream,
  );
  const stepQueue = new CloudflareStepQueue(deps.queue);
  const tokenProvider = new BetterAuthTokenProvider(deps.auth);
  const playlistGateway = new YouTubePlaylistGateway();

  return {
    createCreatePlaylistActionJob: createCreatePlaylistActionJobUsecase({
      accounts,
      idGenerator: cryptoRandomIdGenerator,
      jobs,
      progressPublisher,
      stepQueue,
    }),
    dismissPlaylistActionJobs: createDismissPlaylistActionJobsUsecase({
      jobs,
      progressPublisher,
    }),
    getJobProgressSnapshot: createGetJobProgressSnapshotUsecase({
      jobs,
    }),
    processPlaylistActionDlqMessage:
      createProcessPlaylistActionDlqMessageUsecase({
        jobs,
        progressPublisher,
      }),
    processPlaylistActionStep: createProcessPlaylistActionStepUsecase({
      accounts,
      idGenerator: cryptoRandomIdGenerator,
      jobs,
      playlistGateway,
      progressPublisher,
      stepQueue,
      tokenProvider,
    }),
  };
};

export type PlaylistActionServices = ReturnType<
  typeof createPlaylistActionServices
>;
