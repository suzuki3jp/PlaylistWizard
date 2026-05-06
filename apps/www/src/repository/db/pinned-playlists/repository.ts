import { and, eq } from "drizzle-orm";
import {
  type AccountId,
  type PlaylistId,
  toPlaylistId,
  type UserId,
} from "@/entities/ids";
import { db as dbInstance } from "@/lib/db";
import { pinnedPlaylists } from "@/lib/db/schema";

type PinnedPlaylistRow = {
  playlistId: string;
};

type PinnedPlaylistInsertValue = {
  id: string;
  userId: UserId;
  accountId: AccountId;
  playlistId: PlaylistId;
  provider: string;
};

type Db = {
  query: {
    pinnedPlaylists: {
      findMany: (
        options: Parameters<
          typeof dbInstance.query.pinnedPlaylists.findMany
        >[0],
      ) => Promise<PinnedPlaylistRow[]>;
    };
  };
  insert: (table: typeof pinnedPlaylists) => {
    values: (value: PinnedPlaylistInsertValue) => {
      onConflictDoNothing: () => unknown;
    };
  };
  delete: (table: typeof pinnedPlaylists) => {
    where: (
      where: Parameters<ReturnType<typeof dbInstance.delete>["where"]>[0],
    ) => unknown;
  };
};

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
    accountId: AccountId;
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
    accountId: AccountId,
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
