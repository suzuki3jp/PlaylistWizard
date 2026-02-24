"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Feedback } from "@/features/feedback/components/feedback";
import { useT } from "@/presentation/hooks/t/client";
import { SearchFilters } from "./components/search-filters";
import { SearchResults } from "./components/search-results";
import { type SearchFilter, SearchOrder } from "./entities";
import { useSearchParams } from "./hooks/use-search-params";

const ORDER_OPTIONS = Object.values(SearchOrder);

export function SearchView() {
  const { t } = useT("search");
  const [{ q, filter, order }, setParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(q);

  useEffect(() => setInputValue(q), [q]);

  const currentFilter = filter as SearchFilter;
  const currentOrder = order as SearchOrder;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (query) setParams({ q: query });
  };

  return (
    <main className="flex justify-center">
      <div className="flex min-h-screen w-full max-w-xl flex-col space-y-6 px-4 py-8">
        <div className="flex items-start gap-3 rounded-lg border border-amber-700/40 bg-amber-950/30 p-3 text-sm">
          <span className="mt-0.5 shrink-0 rounded bg-amber-500 px-1.5 py-0.5 font-semibold text-black text-xs">
            Beta
          </span>
          <p className="flex-1 text-amber-200/90">{t("beta.notice")}</p>
          <Feedback
            titlePrefix="[SEARCH]"
            trigger={(open) => (
              <Button
                variant="outline"
                size="sm"
                onClick={open}
                className="shrink-0 border-amber-700/50 bg-amber-900/40 text-amber-300 hover:bg-amber-800/50 hover:text-amber-300"
              >
                {t("beta.feedback")}
              </Button>
            )}
          />
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            aria-label={t("search-box.placeholder")}
            placeholder={t("search-box.placeholder")}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pr-4 pl-9 text-sm text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none"
          />
        </form>

        <div className="flex items-center justify-between">
          <SearchFilters
            filter={currentFilter}
            onFilterChange={(f) => setParams({ filter: f })}
            t={t}
          />

          <Select
            value={currentOrder}
            onValueChange={(v) => setParams({ order: v as SearchOrder })}
          >
            <SelectTrigger className="w-36 border-gray-700 bg-gray-800 text-sm text-white focus:ring-pink-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-gray-700 bg-gray-800 text-white">
              {ORDER_OPTIONS.map((o) => (
                <SelectItem
                  key={o}
                  value={o}
                  className="text-gray-300 focus:bg-gray-700 focus:text-white"
                >
                  {t(`order.${o}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SearchResults
          query={q}
          filter={currentFilter}
          order={currentOrder}
          t={t}
        />
      </div>
    </main>
  );
}
