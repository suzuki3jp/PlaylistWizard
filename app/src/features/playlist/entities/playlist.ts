import { z } from "zod";
import type { Unbrand } from "@/lib/types/unbrand";
import { PlaylistItem } from "./playlist-item";

export const Playlist = z
  .object({
    id: z.string(),
    title: z.string(),
    thumbnailUrl: z.url(),
    itemsTotal: z.number().int().nonnegative(),
    url: z.url(),
  })
  .brand<"playlistwizard-playlist">();

export type Playlist = z.infer<typeof Playlist>;

export const FullPlaylist = Playlist.extend({
  items: z.array(PlaylistItem),
}).brand<"playlistwizard-full-playlist">();

export type FullPlaylist = z.infer<typeof FullPlaylist>;

export const PlaylistPrivacy = z.enum(["public", "private", "unlisted"]);

export type PlaylistPrivacy = z.infer<typeof PlaylistPrivacy>;

export function createDummyPlaylist(
  data: Partial<Unbrand<Playlist>>,
): Playlist {
  return Playlist.parse({
    id: data.id ?? "dummy-id",
    title: data.title ?? "Dummy Title",
    thumbnailUrl: data.thumbnailUrl ?? "https://example.com/thumbnail.jpg",
    itemsTotal: data.itemsTotal ?? 0,
    url: data.url ?? "https://example.com/playlist",
  });
}
