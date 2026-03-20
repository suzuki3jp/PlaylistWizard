"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useFocusedAccount } from "@/features/accounts";
import type { SearchFilter, SearchOrder } from "@/features/search/entities";
import { isOk } from "@/usecase/actions/plain-result";
import { searchVideos } from "@/usecase/actions/search-videos";

export function useSearch(
  query: string,
  filter: SearchFilter,
  order: SearchOrder,
) {
  const [focusedAccount] = useFocusedAccount();

  return useInfiniteQuery({
    queryKey: ["search", query, filter, order, focusedAccount?.id],
    queryFn: async ({ pageParam }) => {
      if (!query || !focusedAccount?.id)
        return { items: [], nextPageToken: undefined };
      const result = await searchVideos({
        query,
        filter,
        order,
        pageToken: pageParam as string | undefined,
        accId: focusedAccount.id,
      });
      if (!isOk(result)) throw new Error(`Search failed: ${result.status}`);
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    enabled: query.length > 0 && !!focusedAccount?.id,
    staleTime: 1000 * 60 * 5,
  });
}
