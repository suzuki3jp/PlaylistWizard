import { z } from "zod";

const StructuredPlaylistsDefinitionPlaylistSchema = z.object({
  id: z.string(),
  get dependencies() {
    return z.array(StructuredPlaylistsDefinitionPlaylistSchema).optional();
  },
});

export const StructuredPlaylistsDefinitionSchema = z.object({
  version: z.literal(1),
  name: z.string(),
  provider: z.enum(["google", "spotify"]),
  user_id: z.string(),
  playlists: z.array(StructuredPlaylistsDefinitionPlaylistSchema),
});

export type StructuredPlaylistsDefinition = z.infer<
  typeof StructuredPlaylistsDefinitionSchema
>;
