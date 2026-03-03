import {
  type PlaylistItemId,
  toPlaylistItemId,
  toVideoId,
  type VideoId,
} from "@/entities/ids";

export type PlaylistItem = {
  id: PlaylistItemId;
  title: string;
  thumbnailUrl: string;
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
    thumbnailUrl: data.thumbnailUrl ?? "https://example.com/thumbnail.jpg",
    position: data.position ?? 0,
    author: data.author ?? "Dummy Author",
    videoId: toVideoId(data.videoId ?? "dummy-video-id"),
    url: data.url ?? "https://example.com/video",
  };
}
