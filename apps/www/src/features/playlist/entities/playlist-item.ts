import {
  type PlaylistItemId,
  toPlaylistItemId,
  toVideoId,
  type VideoId,
} from "@/entities/ids";
import type { Thumbnail } from "@/entities/thumbnail";

export type PlaylistItem = {
  id: PlaylistItemId;
  title: string;
  thumbnails: Thumbnail[];
  position: number;
  author: string;
  videoId: VideoId;
  url: string;
};

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
    id: toPlaylistItemId(data.id ?? "dummy-id"),
    title: data.title ?? "Dummy Title",
    thumbnails: data.thumbnails ?? [
      { url: "https://example.com/thumbnail.jpg", width: 640, height: 480 },
    ],
    position: data.position ?? 0,
    author: data.author ?? "Dummy Author",
    videoId: toVideoId(data.videoId ?? "dummy-video-id"),
    url: data.url ?? "https://example.com/video",
  };
}
