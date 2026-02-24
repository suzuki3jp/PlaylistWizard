import { z } from "zod";
import { YouTubeThumbnails } from "./thumbnail";

export const VideoDetailResource = z.object({
  kind: z.literal("youtube#video"),
  id: z.string(),
  snippet: z.object({
    title: z.string(),
    channelTitle: z.string().optional(),
    publishedAt: z.string().optional(),
    thumbnails: YouTubeThumbnails,
  }),
  contentDetails: z
    .object({
      duration: z.string().optional(),
    })
    .optional(),
  statistics: z
    .object({
      viewCount: z.string().optional(),
    })
    .optional(),
});

export type VideoDetailResource = z.infer<typeof VideoDetailResource>;
