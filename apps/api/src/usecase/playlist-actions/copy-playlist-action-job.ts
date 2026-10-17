import { CopyPlaylistActionPayload } from "@playlistwizard/playlist-action-job";
import {
  AccountAccess,
  IdGenerator,
  JobProgressPublisher,
  PlaylistActionJobRepository,
  StepQueue,
} from "./ports";
import { AccountId, UserId } from "@playlistwizard/core";

export type CopyPlaylistActionJobCommand = Omit<
  CopyPlaylistActionPayload,
  "accountId" | "sourceAccountId"
> & {
  accountId: AccountId;
  sourceAccountId: AccountId;
  userId: UserId;
};

export function enqueueCopyPlaylistActionJobUsecase(deps: {
  accounts: AccountAccess;
  idGenerator: IdGenerator;
  jobs: PlaylistActionJobRepository;
  progressPublisher: JobProgressPublisher;
  stepQueue: StepQueue;
}) {
  return async function (command: CopyPlaylistActionJobCommand) {
    const accountId = command.accountId;
    const sourceAccountId = command.sourceAccountId;

    // Check if both accounts exist
    const [account, sourceAccount] = await Promise.all([
      deps.accounts.findExecutionAccount({
        accountId,
        userId: command.userId,
      }),
      deps.accounts.findExecutionAccount({
        accountId: sourceAccountId,
        userId: command.userId,
      }),
    ]);
    if (!account || !sourceAccount) {
      return { type: "account_not_found" };
    }

    const _jobId = deps.idGenerator.generateJobId();
    const _planStepId = deps.idGenerator.generateStepId();
  };
}
