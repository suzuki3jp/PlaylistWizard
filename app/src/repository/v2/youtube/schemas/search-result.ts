import { z } from "zod";
import { YouTubeThumbnails } from "./thumbnail";

export const SearchResultResource = z.object({
  kind: z.literal("youtube#searchResult"),
  id: z.object({
    kind: z.string(),
    videoId: z.string().optional(),
  }),
  snippet: z.object({
    title: z.string(),
    channelTitle: z.string(),
    publishedAt: z.string(),
    thumbnails: YouTubeThumbnails,
  }),
});

export type SearchResultResource = z.infer<typeof SearchResultResource>;
