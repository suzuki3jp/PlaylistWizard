"use server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account, pinnedPlaylists } from "@/lib/db/schema";

async function getAccountId(
  userId: string,
  provider: string,
): Promise<string | null> {
  const row = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, provider)),
  });
  return row?.accountId ?? null;
}

export async function getPinnedPlaylistIds(): Promise<string[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const rows = await db.query.pinnedPlaylists.findMany({
    where: eq(pinnedPlaylists.userId, session.user.id),
  });

  return rows.map((row) => row.playlistId);
}

export async function pinPlaylist(
  playlistId: string,
  provider: string,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const userId = session.user.id;
  const accountId = await getAccountId(userId, provider);
  if (!accountId) return;

  await db
    .insert(pinnedPlaylists)
    .values({
      id: crypto.randomUUID(),
      userId,
      accountId,
      playlistId,
      provider,
    })
    .onConflictDoNothing();
}

export async function unpinPlaylist(
  playlistId: string,
  provider: string,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const userId = session.user.id;
  const accountId = await getAccountId(userId, provider);
  if (!accountId) return;

  await db
    .delete(pinnedPlaylists)
    .where(
      and(
        eq(pinnedPlaylists.userId, userId),
        eq(pinnedPlaylists.accountId, accountId),
        eq(pinnedPlaylists.playlistId, playlistId),
      ),
    );
}
