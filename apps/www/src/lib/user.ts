import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import type { AccountId, ProviderAccountId, UserId } from "@/entities/ids";
import { auth } from "@/lib/auth";
import { getSession } from "@/repository/auth/session";
import { userDbRepository } from "@/repository/db/user/repository";

import "server-only";

export interface UserProvider {
  id: AccountId; // account.id (DB PK)
  providerId: string;
  accountId: ProviderAccountId;
  scopes: string[];
}

export interface User {
  id: UserId;
  name: string;
  email: string;
  image: string | null;
  isDeveloper: boolean;
  providers: UserProvider[];
}

/**
 * Returns a provider access token for an Account owned by the session user.
 *
 * Better Auth resolves `accountId` (the account row ID) only among the session
 * user's accounts, so an AccountId belonging to another user is never resolved.
 * Returns null when the account cannot be resolved or no token is available.
 */
export async function getAccessToken(accId: AccountId): Promise<string | null> {
  if (!accId) return null;
  try {
    const res = await auth.api.getAccessToken({
      body: { accountId: accId },
      headers: await headers(),
    });
    return res?.accessToken ?? null;
  } catch (err) {
    if (isAPIError(err)) return null;
    throw err;
  }
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
          query: { accountId: p.id },
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
  const session = await getSession();
  if (!session) return null;

  const accounts = await userDbRepository.findAccountsByUserId(session.user.id);

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
    isDeveloper: session.user.isDeveloper ?? false,
    providers,
  };
}
