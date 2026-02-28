import { asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";

import "server-only";

export interface UserProvider {
  id: string; // account.id (DB PK)
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

export async function getAccessToken(accId: string): Promise<string | null> {
  if (!accId) return null;
  const row = await db.query.account.findFirst({
    where: eq(account.id, accId),
  });
  if (!row) return null;
  const res = await auth.api.getAccessToken({
    body: { providerId: row.providerId, accountId: row.id },
    headers: await headers(),
  });
  return res?.accessToken ?? null;
}

export async function getAccessTokenByProvider(
  providerId: string,
): Promise<string | null> {
  const res = await auth.api.getAccessToken({
    body: { providerId },
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
      id: account.id,
      providerId: account.providerId,
      accountId: account.accountId,
      scope: account.scope,
    })
    .from(account)
    .where(eq(account.userId, session.user.id))
    .orderBy(asc(account.createdAt));

  const providers: UserProvider[] = accounts.map((a) => ({
    id: a.id,
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
