import { z } from "zod";
import type { Unbrand } from "@/lib/types/unbrand";

export const PlaylistItem = z
  .object({
    id: z.string(),
    title: z.string(),
    thumbnailUrl: z.url(),
    position: z.number().int().nonnegative(),
    author: z.string(),
    videoId: z.string(),
    url: z.url(),
  })
  .brand<"playlistwizard-playlist-item">();

export type PlaylistItem = z.infer<typeof PlaylistItem>;

export function createPlaylistItem(data: Unbrand<PlaylistItem>): PlaylistItem {
  return PlaylistItem.parse(data);
}

export function createDummyPlaylistItem(
  data: Partial<Unbrand<PlaylistItem>>,
): PlaylistItem {
  return PlaylistItem.parse({
    id: data.id ?? "dummy-id",
    title: data.title ?? "Dummy Title",
    thumbnailUrl:
      data.thumbnailUrl ?? new URL("https://example.com/thumbnail.jpg"),
    position: data.position ?? 0,
    author: data.author ?? "Dummy Author",
    videoId: data.videoId ?? "dummy-video-id",
    url: data.url ?? new URL("https://example.com/video"),
  });
}
