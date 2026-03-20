"use client";

import type { WithT } from "i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchFilter, SearchOrder } from "../entities";
import { useSearch } from "../queries/use-search";
import { SearchResultCard } from "./search-result-card";

interface SearchResultsProps {
  query: string;
  filter: SearchFilter;
  order: SearchOrder;
}

export function SearchResults({
  query,
  filter,
  order,
  t,
}: SearchResultsProps & WithT) {
  const { data, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSearch(query, filter, order);

  if (!query) return null;

  if (isFetching && !data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  const items = [
    ...new Map(
      (data?.pages.flatMap((p) => p.items) ?? []).map((v) => [v.id, v]),
    ).values(),
  ];

  if (items.length === 0 && !isFetching) {
    return (
      <p className="py-8 text-center text-gray-400">{t("result.empty")}</p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((video) => (
        <SearchResultCard key={video.id} video={video} t={t} />
      ))}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
          >
            {isFetchingNextPage ? "..." : t("result.load-more")}
          </Button>
        </div>
      )}
    </div>
  );
}
