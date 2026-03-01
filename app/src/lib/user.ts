import { headers } from "next/headers";
import {
  type AccId,
  type AccountId,
  toAccId,
  toAccountId,
  toUserId,
  type UserId,
} from "@/entities/ids";
import { auth } from "@/lib/auth";
import { userDbRepository } from "@/repository/db/user/repository";

import "server-only";

export interface UserProvider {
  id: AccId; // account.id (DB PK)
  providerId: string;
  accountId: AccountId;
  scopes: string[];
}

export interface User {
  id: UserId;
  name: string;
  email: string;
  image: string | null;
  providers: UserProvider[];
}

export async function getAccessToken(accId: AccId): Promise<string | null> {
  if (!accId) return null;
  const row = await userDbRepository.findAccountById(accId);
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

  const accounts = await userDbRepository.findAccountsByUserId(
    toUserId(session.user.id),
  );

  const providers: UserProvider[] = accounts.map((a) => ({
    id: toAccId(a.id),
    providerId: a.providerId,
    accountId: toAccountId(a.accountId),
    scopes: a.scope ? a.scope.split(",") : [],
  }));

  return {
    id: toUserId(session.user.id),
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
    providers,
  };
}
