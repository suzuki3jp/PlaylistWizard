"use client";
import { useRouter } from "next/navigation";
import { useSelectedPlaylists } from "../../contexts/selected-playlists";
import { PlaylistActionButton } from "../playlist-action-button";
import type { PlaylistActionComponentProps } from "./types";

function useBrowseAction() {
  const router = useRouter();
  const { selectedPlaylists } = useSelectedPlaylists();

  return () => {
    const url = `/playlists/browser?ids=${selectedPlaylists.join(",")}`;
    router.push(url);
  };
}

export function BrowseAction({
  t: _t,
  icon: Icon,
  label,
  disabled,
}: PlaylistActionComponentProps) {
  const handleBrowse = useBrowseAction();

  return (
    <PlaylistActionButton disabled={disabled} onClick={handleBrowse}>
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </PlaylistActionButton>
  );
}
