"use server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { UserProvider, UserProviderProfile } from "@/lib/user";
import { getSessionUser } from "@/lib/user";

async function enrichAccounts(
  providers: UserProvider[],
): Promise<UserProviderProfile[]> {
  const h = await headers();
  return Promise.all(
    providers.map(async (p) => {
      try {
        const info = await auth.api.accountInfo({
          query: { accountId: p.accountId },
          headers: h,
        });
        return {
          ...p,
          name: info?.user.name ?? null,
          email: info?.user.email ?? null,
          image: info?.user.image ?? null,
        };
      } catch {
        return { ...p, name: null, email: null, image: null };
      }
    }),
  );
}

export async function getLinkedAccounts(): Promise<UserProviderProfile[]> {
  const user = await getSessionUser();
  if (!user) return [];
  return enrichAccounts(user.providers);
}
