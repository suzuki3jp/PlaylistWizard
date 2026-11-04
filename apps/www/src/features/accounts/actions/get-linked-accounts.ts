"use server";
import { traceServerAction } from "@/common/telemetry/server-action";
import type { UserProviderProfile } from "@/lib/user";
import { fetchProviderProfiles, getSessionUser } from "@/lib/user";

export async function getLinkedAccounts(): Promise<UserProviderProfile[]> {
  return traceServerAction("accounts.list", async () => {
    const user = await getSessionUser();
    if (!user) return [];
    return fetchProviderProfiles(user.providers);
  });
}
