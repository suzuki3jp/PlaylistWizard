import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { urls } from "@/constants";
import { toUserId, type UserId } from "@/entities/ids";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

import "server-only";

export type DeveloperUser = {
  id: UserId;
  name: string;
  email: string;
};

export async function requireDeveloperPageUser(
  lang: string,
): Promise<DeveloperUser> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(urls.signIn(lang, urls.devConsole(lang)));
  }

  if (!(await isDeveloper(session.user.id))) {
    notFound();
  }

  return {
    id: toUserId(session.user.id),
    name: session.user.name,
    email: session.user.email,
  };
}

export async function requireDeveloperActionUser(): Promise<DeveloperUser> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !(await isDeveloper(session.user.id))) {
    throw new Error("Developer access required");
  }

  return {
    id: toUserId(session.user.id),
    name: session.user.name,
    email: session.user.email,
  };
}

async function isDeveloper(userId: string): Promise<boolean> {
  const row = await db.query.user.findFirst({
    columns: { isDeveloper: true },
    where: eq(user.id, userId),
  });

  return row?.isDeveloper ?? false;
}
