import { z } from "zod";
import { YouTubeThumbnails } from "./thumbnail";

export const PlaylistResource = z.object({
  kind: z.literal("youtube#playlist"),
  id: z.string(),
  snippet: z.object({
    title: z.string(),
    thumbnails: YouTubeThumbnails,
  }),
  contentDetails: z.object({
    itemCount: z.number().int().nonnegative(),
  }),
});

export type PlaylistResource = z.infer<typeof PlaylistResource>;
