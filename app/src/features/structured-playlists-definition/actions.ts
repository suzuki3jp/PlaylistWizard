"use server";
import {
  type StructuredPlaylistsDefinition,
  StructuredPlaylistsDefinitionSchema,
} from "@playlistwizard/core/structured-playlists";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { structuredPlaylistsDefinition } from "@/lib/db/schema";

export async function getAllStructuredPlaylistsDefinitions(): Promise<
  Record<string, StructuredPlaylistsDefinition>
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return {};

  const rows = await db.query.structuredPlaylistsDefinition.findMany({
    where: eq(structuredPlaylistsDefinition.userId, session.user.id),
  });

  const result: Record<string, StructuredPlaylistsDefinition> = {};
  for (const row of rows) {
    const parsed = StructuredPlaylistsDefinitionSchema.safeParse(
      row.definition,
    );
    if (parsed.success) {
      result[row.accId] = parsed.data;
    }
  }
  return result;
}

export async function saveStructuredPlaylistsDefinition(
  accId: string,
  data: StructuredPlaylistsDefinition | null,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const userId = session.user.id;

  if (data === null) {
    await db
      .delete(structuredPlaylistsDefinition)
      .where(
        and(
          eq(structuredPlaylistsDefinition.userId, userId),
          eq(structuredPlaylistsDefinition.accId, accId),
        ),
      );
    return;
  }

  const parsed = StructuredPlaylistsDefinitionSchema.safeParse(data);
  if (!parsed.success) return;

  await db
    .insert(structuredPlaylistsDefinition)
    .values({ userId, accId, definition: parsed.data })
    .onConflictDoUpdate({
      target: [
        structuredPlaylistsDefinition.userId,
        structuredPlaylistsDefinition.accId,
      ],
      set: { definition: parsed.data },
    });
}
