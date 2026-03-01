"use server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { pinnedPlaylistsDbRepository } from "@/repository/db/pinned-playlists/repository";

export async function getPinnedPlaylistIds(): Promise<string[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const rows = await pinnedPlaylistsDbRepository.findManyByUserId(
    session.user.id,
  );

  return rows.map((row) => row.playlistId);
}

export async function pinPlaylist(
  playlistId: string,
  provider: string,
  accountId: string,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  await pinnedPlaylistsDbRepository.insert({
    userId: session.user.id,
    accountId,
    playlistId,
    provider,
  });
}

export async function unpinPlaylist(
  playlistId: string,
  _provider: string,
  accountId: string,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  await pinnedPlaylistsDbRepository.delete(
    session.user.id,
    accountId,
    playlistId,
  );
}
