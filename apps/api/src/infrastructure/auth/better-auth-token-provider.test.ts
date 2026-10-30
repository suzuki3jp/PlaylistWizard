import {
  toAccountId,
  toProviderAccountId,
  toUserId,
} from "@playlistwizard/core/ids";
import { Provider } from "@playlistwizard/core/provider";
import { describe, expect, it, vi } from "vitest";
import type { WorkerAuth } from "./better-auth";
import { BetterAuthTokenProvider } from "./better-auth-token-provider";

const userId = toUserId("user-1");
const account = {
  id: toAccountId("account-row-id"),
  userId,
  providerId: Provider.GOOGLE,
  providerAccountId: toProviderAccountId("provider-account-id"),
};

const createProvider = (getAccessToken: ReturnType<typeof vi.fn>) =>
  new BetterAuthTokenProvider({
    api: { getAccessToken },
  } as unknown as WorkerAuth);

describe("BetterAuthTokenProvider", () => {
  it("selects the account by its Better Auth account ID", async () => {
    const getAccessToken = vi.fn(async () => ({ accessToken: "token" }));

    const token = await createProvider(getAccessToken).getAccessToken({
      account,
      userId,
    });

    expect(token).toBe("token");
    expect(getAccessToken).toHaveBeenCalledWith({
      body: { accountId: "account-row-id", userId: "user-1" },
    });
  });

  it("throws when Better Auth returns no access token", async () => {
    const getAccessToken = vi.fn(async () => ({ accessToken: "" }));

    await expect(
      createProvider(getAccessToken).getAccessToken({ account, userId }),
    ).rejects.toThrow("returned no accessToken for provider=google");
  });
});
