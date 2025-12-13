"use client";
import type { WithT } from "i18next";
import { Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlaylists } from "../contexts/playlists";
import { useSelectedPlaylists } from "../contexts/selected-playlists";
import { PlaylistActionButton } from "./playlist-action-button";

export function BrowseButton({ t }: WithT) {
  const router = useRouter();
  const { playlists } = usePlaylists();
  const { selectedPlaylists } = useSelectedPlaylists();

  if (!playlists) return null;

  const isEnabled =
    selectedPlaylists.length > 0 && selectedPlaylists.length < 3;

  function handleClick() {
    const url = `/playlists/browser?ids=${selectedPlaylists.join(",")}`;
    router.push(url);
  }

  return (
    <PlaylistActionButton disabled={!isEnabled} onClick={handleClick}>
      <SearchIcon className="mr-2 h-4 w-4" />
      {t("playlists.browse")}
    </PlaylistActionButton>
  );
}
