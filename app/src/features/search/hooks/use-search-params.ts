"use client";

import { parseAsString, useQueryStates } from "nuqs";
import { SearchFilter, SearchOrder } from "../entities";

export function useSearchParams() {
  return useQueryStates({
    q: parseAsString.withDefault(""),
    filter: parseAsString.withDefault(SearchFilter.video),
    order: parseAsString.withDefault(SearchOrder.relevance),
  });
}
