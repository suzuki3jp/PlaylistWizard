export interface VideoSearchResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
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
