"use server";
import { headers } from "next/headers";
import { type AccId, type PlaylistId, toUserId } from "@/entities/ids";
import { auth } from "@/lib/auth";
import { pinnedPlaylistsDbRepository } from "@/repository/db/pinned-playlists/repository";

export async function getPinnedPlaylistIds(): Promise<PlaylistId[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const rows = await pinnedPlaylistsDbRepository.findManyByUserId(
    toUserId(session.user.id),
  );

  return rows.map((row) => row.playlistId);
}

export async function pinPlaylist(
  playlistId: PlaylistId,
  provider: string,
  accountId: AccId,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  await pinnedPlaylistsDbRepository.insert({
    userId: toUserId(session.user.id),
    accountId,
    playlistId,
    provider,
  });
}

export async function unpinPlaylist(
  playlistId: PlaylistId,
  _provider: string,
  accountId: AccId,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  await pinnedPlaylistsDbRepository.delete(
    toUserId(session.user.id),
    accountId,
    playlistId,
  );
}
