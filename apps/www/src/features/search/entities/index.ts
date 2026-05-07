import type { VideoId } from "@/entities/ids";
import type { Thumbnail } from "@/entities/thumbnail";

export interface VideoSearchResult {
  id: VideoId;
  title: string;
  channelTitle: string;
  thumbnails: Thumbnail[];
  duration: string;
  viewCount: string;
  publishedAt: string;
}

export const SearchFilter = {
  video: "video",
  song: "song",
} as const;
export type SearchFilter = (typeof SearchFilter)[keyof typeof SearchFilter];

export const SearchOrder = {
  relevance: "relevance",
  date: "date",
  viewCount: "viewCount",
  rating: "rating",
} as const;
export type SearchOrder = (typeof SearchOrder)[keyof typeof SearchOrder];
