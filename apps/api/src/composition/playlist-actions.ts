import type { QueueLike } from "../env";
import { DrizzleAccountAccess } from "../infrastructure/accounts/drizzle-account-access";
import type { WorkerAuth } from "../infrastructure/auth/better-auth";
import { BetterAuthTokenProvider } from "../infrastructure/auth/better-auth-token-provider";
import type { Db } from "../infrastructure/db/connection";
import { cryptoRandomIdGenerator } from "../infrastructure/id-generator";
import { DrizzlePlaylistActionJobRepository } from "../infrastructure/playlist-action-jobs/drizzle-playlist-action-job-repository";
import { YouTubePlaylistGateway } from "../infrastructure/provider/youtube/youtube-playlist-gateway";
import { CloudflareStepQueue } from "../infrastructure/queue/cloudflare-step-queue";
import { createCreatePlaylistActionJobUsecase } from "../usecase/playlist-actions/create-playlist-action-job";
import {
  createProcessPlaylistActionDlqMessageUsecase,
  createProcessPlaylistActionStepUsecase,
} from "../usecase/playlist-actions/process-playlist-action-step";

export const createPlaylistActionServices = (deps: {
  auth: WorkerAuth;
  db: Db;
  queue: QueueLike;
}) => {
  const accounts = new DrizzleAccountAccess(deps.db);
  const jobs = new DrizzlePlaylistActionJobRepository(deps.db);
  const stepQueue = new CloudflareStepQueue(deps.queue);
  const tokenProvider = new BetterAuthTokenProvider(deps.auth);
  const playlistGateway = new YouTubePlaylistGateway();

  return {
    createCreatePlaylistActionJob: createCreatePlaylistActionJobUsecase({
      accounts,
      idGenerator: cryptoRandomIdGenerator,
      jobs,
      stepQueue,
    }),
    processPlaylistActionDlqMessage:
      createProcessPlaylistActionDlqMessageUsecase({
        jobs,
      }),
    processPlaylistActionStep: createProcessPlaylistActionStepUsecase({
      accounts,
      idGenerator: cryptoRandomIdGenerator,
      jobs,
      playlistGateway,
      stepQueue,
      tokenProvider,
    }),
  };
};

export type PlaylistActionServices = ReturnType<
  typeof createPlaylistActionServices
>;
