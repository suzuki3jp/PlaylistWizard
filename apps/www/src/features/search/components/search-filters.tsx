"use client";

import type { WithT } from "i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchFilter } from "../entities";

interface SearchFiltersProps {
  filter: SearchFilter;
  onFilterChange: (filter: SearchFilter) => void;
}

export function SearchFilters({
  filter,
  onFilterChange,
  t,
}: SearchFiltersProps & WithT) {
  return (
    <Tabs
      value={filter}
      onValueChange={(v) => onFilterChange(v as SearchFilter)}
    >
      <TabsList>
        <TabsTrigger value={SearchFilter.video}>
          {t("filter.video")}
        </TabsTrigger>
        <TabsTrigger value={SearchFilter.song}>{t("filter.song")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
