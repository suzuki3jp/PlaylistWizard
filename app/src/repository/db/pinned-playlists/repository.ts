import { and, eq } from "drizzle-orm";
import { db as dbInstance } from "@/lib/db";
import { pinnedPlaylists } from "@/lib/db/schema";

type Db = typeof dbInstance;

export class PinnedPlaylistsDbRepository {
  constructor(private db: Db) {}

  async findManyByUserId(userId: string): Promise<{ playlistId: string }[]> {
    return this.db.query.pinnedPlaylists.findMany({
      where: eq(pinnedPlaylists.userId, userId),
    });
  }

  async insert(data: {
    userId: string;
    accountId: string;
    playlistId: string;
    provider: string;
  }): Promise<void> {
    await this.db
      .insert(pinnedPlaylists)
      .values({ id: crypto.randomUUID(), ...data })
      .onConflictDoNothing();
  }

  async delete(
    userId: string,
    accountId: string,
    playlistId: string,
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
