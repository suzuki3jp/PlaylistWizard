"use server";
import {
  type StructuredPlaylistsDefinition,
  StructuredPlaylistsDefinitionSchema,
} from "@playlistwizard/core/structured-playlists";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { structuredPlaylistsDefinition } from "@/lib/db/schema";

export async function getStructuredPlaylistsDefinition(): Promise<StructuredPlaylistsDefinition | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const row = await db.query.structuredPlaylistsDefinition.findFirst({
    where: eq(structuredPlaylistsDefinition.userId, session.user.id),
  });
  if (!row) return null;

  const parsed = StructuredPlaylistsDefinitionSchema.safeParse(row.definition);
  return parsed.success ? parsed.data : null;
}

export async function saveStructuredPlaylistsDefinition(
  data: StructuredPlaylistsDefinition | null,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const userId = session.user.id;

  if (data === null) {
    await db
      .delete(structuredPlaylistsDefinition)
      .where(eq(structuredPlaylistsDefinition.userId, userId));
    return;
  }

  await db
    .insert(structuredPlaylistsDefinition)
    .values({ userId, definition: data })
    .onConflictDoUpdate({
      target: structuredPlaylistsDefinition.userId,
      set: { definition: data, updatedAt: new Date() },
    });
}
