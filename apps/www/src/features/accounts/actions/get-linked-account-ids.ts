"use server";
import type { AccountId } from "@/entities/ids";
import { getSessionUser } from "@/lib/user";

export async function getLinkedAccountIds(): Promise<AccountId[]> {
  const user = await getSessionUser();
  if (!user) return [];
  return user.providers.map((p) => p.id);
}
