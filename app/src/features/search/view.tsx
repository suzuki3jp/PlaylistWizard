"use client";

import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/presentation/hooks/t/client";
import { SearchFilters } from "./components/search-filters";
import { SearchResults } from "./components/search-results";
import { type SearchFilter, SearchOrder } from "./entities";
import { useSearchParams } from "./hooks/use-search-params";

const ORDER_OPTIONS = Object.values(SearchOrder);

export function SearchView() {
  const { t } = useT("search");
  const [{ q, filter, order }, setParams] = useSearchParams();

  const currentFilter = filter as SearchFilter;
  const currentOrder = order as SearchOrder;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const query = (data.get("q") as string).trim();
    if (query) setParams({ q: query });
  };

  return (
    <main className="flex justify-center">
      <div className="flex min-h-screen w-full max-w-xl flex-col space-y-6 px-4 py-8">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
          <input
            name="q"
            type="search"
            key={q}
            defaultValue={q}
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
