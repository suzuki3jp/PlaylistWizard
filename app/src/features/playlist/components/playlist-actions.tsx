"use client";

import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { useT } from "@/presentation/hooks/t/client";
import { useSearchQuery } from "../contexts/search";
import { BrowseButton } from "./playlist-browse-action-button";
import { CopyButton } from "./playlist-copy-action-button";
import { PlaylistCreateActionButton } from "./playlist-create-action-button";
import { DeduplicateButton } from "./playlist-deduplicate-action-button";
import { DeleteButton } from "./playlist-delete-action-button";
import { ExtractButton } from "./playlist-extract-action-button";
import { MergeButton } from "./playlist-merge-action-button";
import { ShuffleButton } from "./playlist-shuffle-action-button";
import { UndoButton } from "./playlist-undo-action-button";

interface PlaylistActionsProps {
  lang: string;
}

const SyncButtonNoSSR = dynamic(() => import("./playlist-sync-action-button"), {
  ssr: false,
});

export function PlaylistActions({ lang }: PlaylistActionsProps) {
  const { t } = useT(lang);
  const { searchQuery, setSearchQuery } = useSearchQuery();

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex flex-wrap gap-2">
        <UndoButton t={t} />

        {/** Separator */}
        <div className="mx-1 w-px bg-gray-700" />

        <PlaylistCreateActionButton t={t} />
        <CopyButton t={t} />
        <ShuffleButton t={t} />
        <MergeButton t={t} />
        <ExtractButton t={t} />
        <DeleteButton t={t} />
        <DeduplicateButton t={t} />
        <BrowseButton t={t} />
        <SyncButtonNoSSR />
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
