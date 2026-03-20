"use client";

import { Search } from "lucide-react";
import { Fragment } from "react";
import { Input } from "@/components/ui/input";
import { useT } from "@/presentation/hooks/t/client";
import { useSearchQuery } from "../contexts/search";
import { usePlaylistActions } from "./actions";

interface PlaylistActionsProps {
  lang: string;
}

export function PlaylistActions({ lang }: PlaylistActionsProps) {
  const { t } = useT(lang);
  const { searchQuery, setSearchQuery } = useSearchQuery();
  const actions = usePlaylistActions(t);

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Fragment key={action.id}>
            <action.Component
              t={t}
              icon={action.icon}
              label={action.label}
              disabled={action.disabled}
            />
            {action.separatorAfter && <div className="mx-1 w-px bg-gray-700" />}
          </Fragment>
        ))}
      </div>

      <div className="relative w-full md:w-64">
        <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t("playlists.search-placeholder")}
          className="border-gray-700 pl-8 text-white selection:bg-pink-500 focus:border-pink-500 dark:bg-gray-800"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
}
