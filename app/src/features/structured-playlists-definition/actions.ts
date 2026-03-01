"use server";
import {
  type StructuredPlaylistsDefinition,
  StructuredPlaylistsDefinitionSchema,
} from "@playlistwizard/core/structured-playlists";
import { headers } from "next/headers";
import { type AccId, toUserId } from "@/entities/ids";
import { auth } from "@/lib/auth";
import { structuredPlaylistsDefinitionDbRepository } from "@/repository/db/structured-playlists-definition/repository";

export async function getAllStructuredPlaylistsDefinitions(): Promise<
  Record<string, StructuredPlaylistsDefinition>
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return {};

  const rows = await structuredPlaylistsDefinitionDbRepository.findManyByUserId(
    toUserId(session.user.id),
  );

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
  accId: AccId,
  data: StructuredPlaylistsDefinition | null,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const userId = toUserId(session.user.id);

  if (data === null) {
    await structuredPlaylistsDefinitionDbRepository.delete(userId, accId);
    return;
  }

  const parsed = StructuredPlaylistsDefinitionSchema.safeParse(data);
  if (!parsed.success) return;

  await structuredPlaylistsDefinitionDbRepository.upsert(
    userId,
    accId,
    parsed.data,
  );
}
