import { formatError } from "../../shared/format-error";
import type { ProviderTokenProvider } from "../../usecase/playlist-actions/ports";
import type { WorkerAuth } from "./better-auth";

export class BetterAuthTokenProvider implements ProviderTokenProvider {
  constructor(private readonly auth: WorkerAuth) {}

  async getAccessToken(
    input: Parameters<ProviderTokenProvider["getAccessToken"]>[0],
  ) {
    let tokenResult: Awaited<ReturnType<WorkerAuth["api"]["getAccessToken"]>>;
    try {
      tokenResult = await this.auth.api.getAccessToken({
        body: {
          accountId: input.account.providerAccountId,
          providerId: input.account.providerId,
          userId: input.userId,
        },
      });
    } catch (err) {
      throw new Error(`getAccessToken failed: ${formatError(err)}`);
    }

    if (!tokenResult?.accessToken) {
      throw new Error(
        `getAccessToken returned no accessToken for provider=${input.account.providerId}`,
      );
    }

    return tokenResult.accessToken;
  }
}
