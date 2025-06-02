"use client";
import { Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { usePlaylists } from "../contexts";
import type { PlaylistOperationProps } from "./index";

export function BrowseButton({
  t,
}: Omit<PlaylistOperationProps, "refreshPlaylists">) {
  const router = useRouter();
  const { playlists } = usePlaylists();

  if (!playlists) return null;

  const selectedPlaylists = playlists.filter((p) => p.isSelected);

  const isEnabled =
    selectedPlaylists.length > 0 && selectedPlaylists.length < 3;

  function handleClick() {
    const ids = selectedPlaylists.map((playlist) => playlist.data.id);
    const url = `/playlists/browser?ids=${ids.join(",")}`;
    router.push(url);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
      disabled={!isEnabled}
      onClick={handleClick}
    >
      <SearchIcon className="mr-2 h-4 w-4" />
      {t("playlists.browse")}
    </Button>
  );
}
