"use server";

import type { AccId } from "@/entities/ids";
import {
  SearchFilter,
  SearchOrder,
  type VideoSearchResult,
} from "@/features/search/entities";
import { getAccessToken } from "@/lib/user";
import type { YoutubeProviderErrorCode } from "@/repository/providers/youtube";
import { YouTubeRepository } from "@/repository/v2/youtube/repository";
import { fail, ok, type Result } from "@/usecase/actions/plain-result";

const MUSIC_CATEGORY_ID = "10";
const TOPIC_SUFFIX = " - Topic";
const MIN_SONG_RESULTS = 5;
const MAX_SONG_PAGES = 3;

export interface SearchVideosResult {
  items: VideoSearchResult[];
  nextPageToken?: string;
}

export const searchVideos = async ({
  query,
  filter,
  order = SearchOrder.relevance,
  pageToken,
  maxResults = 25,
  accId,
}: SearchVideosOptions): Promise<Result<SearchVideosResult>> => {
  const token = await getAccessToken(accId);
  if (!token) return fail(401);

  const repo = new YouTubeRepository(token);

  if (filter === SearchFilter.song) {
    return searchSongVideos(repo, query, order, pageToken, maxResults);
  }

  const result = await repo.searchVideos(query, {
    pageToken,
    maxResults,
    order,
  });

  if (result.isErr())
    return fail(result.error.code as YoutubeProviderErrorCode);
  return ok(result.value);
};

async function searchSongVideos(
  repo: YouTubeRepository,
  query: string,
  order: SearchOrder,
  pageToken: string | undefined,
  maxResults: number,
): Promise<Result<SearchVideosResult>> {
  // const songQuery = `${query} Topic`; // Adding "Topic" to the query helps in getting official Youtube music songs.
  const songQuery = query;
  let currentPageToken = pageToken;
  const allItems: VideoSearchResult[] = [];
  let finalNextPageToken: string | undefined;
  let pages = 0;

  do {
    const result = await repo.searchVideos(songQuery, {
      videoCategoryId: MUSIC_CATEGORY_ID,
      pageToken: currentPageToken,
      maxResults,
      order,
    });

    if (result.isErr())
      return fail(result.error.code as YoutubeProviderErrorCode);

    const filtered = result.value.items.filter((item) =>
      item.channelTitle.endsWith(TOPIC_SUFFIX),
    );

    allItems.push(...filtered);
    finalNextPageToken = result.value.nextPageToken;
    currentPageToken = result.value.nextPageToken;
    pages++;
  } while (
    !pageToken &&
    allItems.length < MIN_SONG_RESULTS &&
    currentPageToken &&
    pages < MAX_SONG_PAGES
  );

  return ok({ items: allItems, nextPageToken: finalNextPageToken });
}

interface SearchVideosOptions {
  query: string;
  filter: SearchFilter;
  order?: SearchOrder;
  pageToken?: string;
  maxResults?: number;
  accId: AccId;
}
