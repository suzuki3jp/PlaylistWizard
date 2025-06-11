"use client";
import { Search } from "lucide-react";

import type { WithT } from "@/@types";
import { Input } from "@/presentation/shadcn/input";
import { BrowseButton } from "./browse-button";
import { CopyButton } from "./copy-button";
import { DeleteButton } from "./delete-button";
import { ExtractButton } from "./extract-button";
import { MergeButton } from "./merge-button";
import { ShuffleButton } from "./shuffle-button";
import { UndoButton } from "./undo-button";

export interface PlaylistOperationProps extends WithT {
  refreshPlaylists: () => Promise<void>;
}

export function PlaylistOperations({
  t,
  refreshPlaylists,
  searchQuery,
  setSearchQuery,
}: PlaylistOperationProps & {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex flex-wrap gap-2">
        <UndoButton t={t} />

        {/** Separator */}
        <div className="mx-1 w-px bg-gray-700" />

        <CopyButton t={t} refreshPlaylists={refreshPlaylists} />
        <ShuffleButton t={t} refreshPlaylists={refreshPlaylists} />
        <MergeButton t={t} refreshPlaylists={refreshPlaylists} />
        <ExtractButton t={t} refreshPlaylists={refreshPlaylists} />
        <DeleteButton t={t} refreshPlaylists={refreshPlaylists} />
        <BrowseButton t={t} />
      </div>

      <div className="relative w-full md:w-64">
        <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t("playlists.search-placeholder")}
          className="border-gray-700 bg-gray-800 pl-8 text-white selection:bg-pink-500 focus:border-pink-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
}
