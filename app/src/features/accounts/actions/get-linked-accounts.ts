"use server";
import type { UserProviderProfile } from "@/lib/user";
import { fetchProviderProfiles, getSessionUser } from "@/lib/user";

export async function getLinkedAccounts(): Promise<UserProviderProfile[]> {
  const user = await getSessionUser();
  if (!user) return [];
  return fetchProviderProfiles(user.providers);
}
