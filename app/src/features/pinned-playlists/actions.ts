"use server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pinnedPlaylists } from "@/lib/db/schema";

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
  accountId: string,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  await db
    .insert(pinnedPlaylists)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      accountId,
      playlistId,
      provider,
    })
    .onConflictDoNothing();
}

export async function unpinPlaylist(
  playlistId: string,
  _provider: string,
  accountId: string,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  await db
    .delete(pinnedPlaylists)
    .where(
      and(
        eq(pinnedPlaylists.userId, session.user.id),
        eq(pinnedPlaylists.accountId, accountId),
        eq(pinnedPlaylists.playlistId, playlistId),
      ),
    );
}
