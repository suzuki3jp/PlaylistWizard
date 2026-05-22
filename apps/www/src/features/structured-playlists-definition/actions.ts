"use server";
import {
  type StructuredPlaylistsDefinition,
  StructuredPlaylistsDefinitionSchema,
} from "@playlistwizard/core/structured-playlists";
import type { AccountId } from "@/entities/ids";
import { getSession } from "@/repository/auth/session";
import { structuredPlaylistsDefinitionDbRepository } from "@/repository/db/structured-playlists-definition/repository";

export async function getAllStructuredPlaylistsDefinitions(): Promise<
  Record<string, StructuredPlaylistsDefinition>
> {
  const session = await getSession();
  if (!session) return {};

  const rows = await structuredPlaylistsDefinitionDbRepository.findManyByUserId(
    session.user.id,
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
  accId: AccountId,
  data: StructuredPlaylistsDefinition | null,
): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const userId = session.user.id;

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
