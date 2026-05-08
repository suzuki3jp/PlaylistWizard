import { headers } from "next/headers";
import { cache } from "react";
import type { UserId } from "@/entities/ids";
import { toUserId } from "@/entities/ids";
import { auth, type Session } from "@/lib/auth";

import "server-only";

export type AppSession = Omit<Session, "session" | "user"> & {
  session: Omit<Session["session"], "userId"> & {
    userId: UserId;
  };
  user: Omit<Session["user"], "id"> & {
    id: UserId;
  };
};

export const getSession = cache(async (): Promise<AppSession | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  return {
    ...session,
    session: {
      ...session.session,
      userId: toUserId(session.session.userId),
    },
    user: {
      ...session.user,
      id: toUserId(session.user.id),
    },
  };
});
