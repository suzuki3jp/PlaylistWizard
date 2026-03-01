import { toPlaylistId, toPlaylistItemId, toVideoId } from "@/entities/ids";
import { Provider } from "@/entities/provider";
import type { Playlist, PlaylistItem } from "@/features/playlist/entities";
import type { VideoSearchResult } from "@/features/search/entities";
import type { PlaylistResource } from "./schemas/playlist";
import type { PlaylistItemResource } from "./schemas/playlist-item";
import type { YouTubeThumbnail } from "./schemas/thumbnail";
import type { VideoDetailResource } from "./schemas/video-detail";

const YOUTUBE_NO_THUMBNAIL_SUFFIX = "/no_thumbnail.jpg";
const YOUTUBE_DEFAULT_THUMBNAIL = "https://i.ytimg.com/img/no_thumbnail.jpg";

export function transformPlaylist(resource: PlaylistResource): Playlist {
  return {
    id: toPlaylistId(resource.id),
    title: resource.snippet.title,
    thumbnailUrl: extractThumbnailUrl(resource.snippet.thumbnails, "largest"),
    itemsTotal: resource.contentDetails.itemCount,
    url: `https://www.youtube.com/playlist?list=${resource.id}`,
    provider: Provider.GOOGLE,
  };
}

export function transformPlaylistItem(
  resource: PlaylistItemResource,
): PlaylistItem {
  return {
    id: toPlaylistItemId(resource.id),
    title: resource.snippet.title,
    thumbnailUrl: extractThumbnailUrl(resource.snippet.thumbnails, "smallest"),
    position: resource.snippet.position,
    author: resource.snippet.channelTitle,
    videoId: toVideoId(resource.contentDetails.videoId),
    url: `https://www.youtube.com/watch?v=${resource.contentDetails.videoId}`,
  };
}

export function toVideoSearchResult(
  detailResource: VideoDetailResource,
): VideoSearchResult {
  return {
    id: toVideoId(detailResource.id),
    title: detailResource.snippet.title,
    channelTitle: detailResource.snippet.channelTitle ?? "",
    thumbnailUrl: extractThumbnailUrl(
      detailResource.snippet.thumbnails,
      "largest",
    ),
    duration: detailResource.contentDetails?.duration ?? "",
    viewCount: detailResource.statistics?.viewCount ?? "0",
    publishedAt: detailResource.snippet.publishedAt ?? "",
  };
}

type ThumbnailSize = "largest" | "smallest";

type Thumbnails = {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
};

function extractThumbnailUrl(
  thumbnails: Thumbnails,
  size: ThumbnailSize,
): string {
  const priorities =
    size === "largest"
      ? (["maxres", "standard", "high", "medium", "default"] as const)
      : (["default", "medium", "high", "standard", "maxres"] as const);

  for (const key of priorities) {
    const thumb = thumbnails[key];
    if (thumb?.url && !thumb.url.endsWith(YOUTUBE_NO_THUMBNAIL_SUFFIX)) {
      return thumb.url;
    }
  }

  return YOUTUBE_DEFAULT_THUMBNAIL;
}
