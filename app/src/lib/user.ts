import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";

import "server-only";

export interface UserProvider {
  providerId: string;
  accountId: string;
  scopes: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  providers: UserProvider[];
}

export async function getAccessToken(
  providerId: string,
  accountId?: string,
): Promise<string | null> {
  const res = await auth.api.getAccessToken({
    body: { providerId, ...(accountId ? { accountId } : {}) },
    headers: await headers(),
  });
  return res?.accessToken ?? null;
}

export interface UserProviderProfile extends UserProvider {
  name: string | null;
  email: string | null;
  image: string | null;
}

export async function fetchProviderProfiles(
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

export async function getSessionUser(): Promise<User | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return null;

  const accounts = await db
    .select({
      providerId: account.providerId,
      accountId: account.accountId,
      scope: account.scope,
    })
    .from(account)
    .where(eq(account.userId, session.user.id));

  const providers: UserProvider[] = accounts.map((a) => ({
    providerId: a.providerId,
    accountId: a.accountId,
    scopes: a.scope ? a.scope.split(",") : [],
  }));

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
    providers,
  };
}
