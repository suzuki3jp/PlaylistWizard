export type PlaylistItem = {
  id: string;
  title: string;
  thumbnailUrl: string;
  position: number;
  author: string;
  videoId: string;
  url: string;
};

export function createDummyPlaylistItem(
  data: Partial<PlaylistItem>,
): PlaylistItem {
  return {
    id: data.id ?? "dummy-id",
    title: data.title ?? "Dummy Title",
    thumbnailUrl: data.thumbnailUrl ?? "https://example.com/thumbnail.jpg",
    position: data.position ?? 0,
    author: data.author ?? "Dummy Author",
    videoId: data.videoId ?? "dummy-video-id",
    url: data.url ?? "https://example.com/video",
  };
}
