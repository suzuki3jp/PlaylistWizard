import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";

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
): Promise<string | null> {
  const res = await auth.api.getAccessToken({
    body: { providerId },
    headers: await headers(),
  });
  return res?.accessToken ?? null;
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
