import { z } from "zod";

const StructuredPlaylistsDefinitionPlaylistSchema = z.object({
  id: z.string(),
  // https://zod.dev/api?id=recursive-objects#recursive-objects
  get dependencies(): z.ZodOptional<
    z.ZodArray<typeof StructuredPlaylistsDefinitionPlaylistSchema>
  > {
    return z.array(StructuredPlaylistsDefinitionPlaylistSchema).optional();
  },
});

export const StructuredPlaylistsDefinitionSchema = z.object({
  version: z.literal(1),
  name: z.string(),
  provider: z.enum(["google"]),
  playlists: z.array(StructuredPlaylistsDefinitionPlaylistSchema),
});

export type StructuredPlaylistsDefinition = z.infer<
  typeof StructuredPlaylistsDefinitionSchema
>;
