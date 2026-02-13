import { z } from "zod";
import { YouTubeThumbnails } from "./thumbnail";

export const PlaylistItemResource = z.object({
  kind: z.literal("youtube#playlistItem"),
  id: z.string(),
  snippet: z.object({
    playlistId: z.string(),
    title: z.string(),
    position: z.number().int().nonnegative(),
    thumbnails: YouTubeThumbnails,
    channelTitle: z.string(),
    resourceId: z.object({
      kind: z.literal("youtube#video"),
      videoId: z.string(),
    }),
  }),
  contentDetails: z.object({
    videoId: z.string(),
  }),
});

export type PlaylistItemResource = z.infer<typeof PlaylistItemResource>;
