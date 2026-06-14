import { toPlaylistItemId, toVideoId } from "@playlistwizard/core/ids";
import type { PlaylistItem } from "@playlistwizard/core/playlist";

export type { PlaylistItem } from "@playlistwizard/core/playlist";

type CreateDummyPlaylistItemInput = Partial<
  Omit<PlaylistItem, "id" | "videoId">
> & {
  id?: string;
  videoId?: string;
};

export function createDummyPlaylistItem(
  data: CreateDummyPlaylistItemInput,
): PlaylistItem {
  return {
    author: data.author ?? "Dummy Author",
    id: toPlaylistItemId(data.id ?? "dummy-id"),
    position: data.position ?? 0,
    thumbnails: data.thumbnails ?? [
      { height: 480, url: "https://example.com/thumbnail.jpg", width: 640 },
    ],
    title: data.title ?? "Dummy Title",
    url: data.url ?? "https://example.com/video",
    videoId: toVideoId(data.videoId ?? "dummy-video-id"),
  };
}
