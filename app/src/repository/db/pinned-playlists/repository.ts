import { and, eq } from "drizzle-orm";
import {
  type AccId,
  type PlaylistId,
  toPlaylistId,
  type UserId,
} from "@/entities/ids";
import { db as dbInstance } from "@/lib/db";
import { pinnedPlaylists } from "@/lib/db/schema";

type Db = typeof dbInstance;

export class PinnedPlaylistsDbRepository {
  constructor(private db: Db) {}

  async findManyByUserId(
    userId: UserId,
  ): Promise<{ playlistId: PlaylistId }[]> {
    const rows = await this.db.query.pinnedPlaylists.findMany({
      where: eq(pinnedPlaylists.userId, userId),
    });
    return rows.map((row) => ({ playlistId: toPlaylistId(row.playlistId) }));
  }

  async insert(data: {
    userId: UserId;
    accountId: AccId;
    playlistId: PlaylistId;
    provider: string;
  }): Promise<void> {
    await this.db
      .insert(pinnedPlaylists)
      .values({ id: crypto.randomUUID(), ...data })
      .onConflictDoNothing();
  }

  async delete(
    userId: UserId,
    accountId: AccId,
    playlistId: PlaylistId,
  ): Promise<void> {
    await this.db
      .delete(pinnedPlaylists)
      .where(
        and(
          eq(pinnedPlaylists.userId, userId),
          eq(pinnedPlaylists.accountId, accountId),
          eq(pinnedPlaylists.playlistId, playlistId),
        ),
      );
  }
}

export const pinnedPlaylistsDbRepository = new PinnedPlaylistsDbRepository(
  dbInstance,
);
