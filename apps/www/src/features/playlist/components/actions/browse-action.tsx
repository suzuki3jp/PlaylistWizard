"use client";
import { useRouter } from "next/navigation";
import { emitGa4Event } from "@/common/emit-ga4-event";
import * as ga4Events from "@/constants/ga4-events";
import { useSelectedPlaylists } from "../../contexts/selected-playlists";
import { PlaylistActionButton } from "../playlist-action-button";
import type { PlaylistActionComponentProps } from "./types";

function useBrowseAction() {
  const router = useRouter();
  const { selectedPlaylists } = useSelectedPlaylists();

  return () => {
    emitGa4Event(ga4Events.browsePlaylist);
    const url = `/playlists/browser?ids=${selectedPlaylists.map((p) => p.id).join(",")}`;
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
