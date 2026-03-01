import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import { and, eq } from "drizzle-orm";
import { db as dbInstance } from "@/lib/db";
import { structuredPlaylistsDefinition } from "@/lib/db/schema";

type Db = typeof dbInstance;

export class StructuredPlaylistsDefinitionDbRepository {
  constructor(private db: Db) {}

  async findManyByUserId(
    userId: string,
  ): Promise<{ accId: string; definition: StructuredPlaylistsDefinition }[]> {
    return this.db.query.structuredPlaylistsDefinition.findMany({
      where: eq(structuredPlaylistsDefinition.userId, userId),
    });
  }

  async upsert(
    userId: string,
    accId: string,
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

  async delete(userId: string, accId: string): Promise<void> {
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
