import {
  type AccountId,
  toPlaylistId,
  toPlaylistItemId,
  toVideoId,
} from "@/entities/ids";
import { Provider } from "@/entities/provider";
import type { Thumbnail } from "@/entities/thumbnail";
import type { Playlist, PlaylistItem } from "@/features/playlist/entities";
import type { VideoSearchResult } from "@/features/search/entities";
import type { PlaylistResource } from "./schemas/playlist";
import type { PlaylistItemResource } from "./schemas/playlist-item";
import type { YouTubeThumbnail } from "./schemas/thumbnail";
import type { VideoDetailResource } from "./schemas/video-detail";

const YOUTUBE_NO_THUMBNAIL_SUFFIX = "/no_thumbnail.jpg";
const YOUTUBE_DEFAULT_THUMBNAIL = "https://i.ytimg.com/img/no_thumbnail.jpg";

const YOUTUBE_THUMBNAIL_DEFAULTS: Record<
  string,
  { width: number; height: number }
> = {
  default: { width: 120, height: 90 },
  medium: { width: 320, height: 180 },
  high: { width: 480, height: 360 },
  standard: { width: 640, height: 480 },
  maxres: { width: 1280, height: 720 },
};

const THUMBNAIL_QUALITY_ORDER = [
  "maxres",
  "standard",
  "high",
  "medium",
  "default",
] as const;

type YTThumbnails = {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
};

function extractThumbnails(thumbnails: YTThumbnails): Thumbnail[] {
  const results = THUMBNAIL_QUALITY_ORDER.map((key) => {
    const t = thumbnails[key];
    if (!t || t.url.endsWith(YOUTUBE_NO_THUMBNAIL_SUFFIX)) return null;
    const dims = YOUTUBE_THUMBNAIL_DEFAULTS[key];
    return {
      url: t.url,
      width: t.width ?? dims.width,
      height: t.height ?? dims.height,
    };
  }).filter((t): t is Thumbnail => t !== null);

  if (results.length === 0) {
    return [
      { url: YOUTUBE_DEFAULT_THUMBNAIL, ...YOUTUBE_THUMBNAIL_DEFAULTS.default },
    ];
  }
  return results;
}

export function transformPlaylist(
  resource: PlaylistResource,
  accountId: AccountId,
): Playlist {
  return {
    id: toPlaylistId(resource.id),
    accountId,
    title: resource.snippet.title,
    thumbnails: extractThumbnails(resource.snippet.thumbnails),
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
    thumbnails: extractThumbnails(resource.snippet.thumbnails),
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
    thumbnails: extractThumbnails(detailResource.snippet.thumbnails),
    duration: detailResource.contentDetails?.duration ?? "",
    viewCount: detailResource.statistics?.viewCount ?? "0",
    publishedAt: detailResource.snippet.publishedAt ?? "",
  };
}
