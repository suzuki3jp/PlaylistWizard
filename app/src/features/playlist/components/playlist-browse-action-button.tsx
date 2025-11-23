"use client";
import type { WithT } from "i18next";
import { Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/presentation/shadcn/button";
import { usePlaylists } from "../contexts/playlists";
import { useSelectedPlaylists } from "../contexts/selected-playlists";

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
