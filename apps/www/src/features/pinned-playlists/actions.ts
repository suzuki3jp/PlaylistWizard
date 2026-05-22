"use server";
import type { AccountId, PlaylistId } from "@/entities/ids";
import { getSession } from "@/repository/auth/session";
import { pinnedPlaylistsDbRepository } from "@/repository/db/pinned-playlists/repository";

export async function getPinnedPlaylistIds(): Promise<PlaylistId[]> {
  const session = await getSession();
  if (!session) return [];

  const rows = await pinnedPlaylistsDbRepository.findManyByUserId(
    session.user.id,
  );

  return rows.map((row) => row.playlistId);
}

export async function pinPlaylist(
  playlistId: PlaylistId,
  provider: string,
  accountId: AccountId,
): Promise<void> {
  const session = await getSession();
  if (!session) return;

  await pinnedPlaylistsDbRepository.insert({
    userId: session.user.id,
    accountId,
    playlistId,
    provider,
  });
}

export async function unpinPlaylist(
  playlistId: PlaylistId,
  _provider: string,
  accountId: AccountId,
): Promise<void> {
  const session = await getSession();
  if (!session) return;

  await pinnedPlaylistsDbRepository.delete(
    session.user.id,
    accountId,
    playlistId,
  );
}
