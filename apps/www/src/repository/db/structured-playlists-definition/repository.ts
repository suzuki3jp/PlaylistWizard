import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import { and, eq } from "drizzle-orm";
import { type AccountId, toAccountId, type UserId } from "@/entities/ids";
import { db as dbInstance } from "@/lib/db";
import { structuredPlaylistsDefinition } from "@/lib/db/schema";

type StructuredPlaylistsDefinitionRow = {
  accId: string;
  definition: StructuredPlaylistsDefinition;
};

type StructuredPlaylistsDefinitionInsertValue = {
  userId: UserId;
  accId: AccountId;
  definition: StructuredPlaylistsDefinition;
};

type FindManyOptions = NonNullable<
  Parameters<typeof dbInstance.query.structuredPlaylistsDefinition.findMany>[0]
>;
type InsertQuery = ReturnType<ReturnType<typeof dbInstance.insert>["values"]>;
type OnConflictDoUpdateOptions = Parameters<
  InsertQuery["onConflictDoUpdate"]
>[0];

type Db = {
  query: {
    structuredPlaylistsDefinition: {
      findMany: (
        options: FindManyOptions,
      ) => Promise<StructuredPlaylistsDefinitionRow[]>;
    };
  };
  insert: (table: typeof structuredPlaylistsDefinition) => {
    values: (value: StructuredPlaylistsDefinitionInsertValue) => {
      onConflictDoUpdate: (options: OnConflictDoUpdateOptions) => unknown;
    };
  };
  delete: (table: typeof structuredPlaylistsDefinition) => {
    where: (
      where: Parameters<ReturnType<typeof dbInstance.delete>["where"]>[0],
    ) => unknown;
  };
};

export class StructuredPlaylistsDefinitionDbRepository {
  constructor(private db: Db) {}

  async findManyByUserId(
    userId: UserId,
  ): Promise<
    { accId: AccountId; definition: StructuredPlaylistsDefinition }[]
  > {
    const rows = await this.db.query.structuredPlaylistsDefinition.findMany({
      where: eq(structuredPlaylistsDefinition.userId, userId),
    });
    return rows.map((row) => ({
      accId: toAccountId(row.accId),
      definition: row.definition,
    }));
  }

  async upsert(
    userId: UserId,
    accId: AccountId,
    definition: StructuredPlaylistsDefinition,
  ): Promise<void> {
    await this.db
      .insert(structuredPlaylistsDefinition)
      .values({ userId, accId, definition })
      .onConflictDoUpdate({
        target: [
          structuredPlaylistsDefinition.userId,
          structuredPlaylistsDefinition.accId,
        ],
        set: { definition },
      });
  }

  async delete(userId: UserId, accId: AccountId): Promise<void> {
    await this.db
      .delete(structuredPlaylistsDefinition)
      .where(
        and(
          eq(structuredPlaylistsDefinition.userId, userId),
          eq(structuredPlaylistsDefinition.accId, accId),
        ),
      );
  }
}

export const structuredPlaylistsDefinitionDbRepository =
  new StructuredPlaylistsDefinitionDbRepository(dbInstance);
