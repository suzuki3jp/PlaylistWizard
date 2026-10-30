"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import * as ga4Events from "@/constants/ga4-events";
import { useSelectedPlaylists } from "../../contexts/selected-playlists";
import { PlaylistActionButton } from "../playlist-action-button";
import type { PlaylistActionComponentProps } from "./types";

/**
 * Navigates to the playlist browser for the selected playlists.
 *
 * The browser URL depends on the current selection, so it usually has not
 * been prefetched and the route fallback is not available until the server
 * responds. Running `router.push` in a transition exposes that wait as
 * `isPending`, which ends when the navigation commits, fails, or is replaced
 * by another navigation.
 */
function useBrowseAction() {
  const router = useRouter();
  const { selectedPlaylists } = useSelectedPlaylists();
  const [isPending, startTransition] = useTransition();

  const browse = () => {
    emitGa4Event(ga4Events.browsePlaylist);
    const url = `/playlists/browser?ids=${selectedPlaylists.map((p) => p.id).join(",")}`;
    startTransition(() => router.push(url));
  };

  return { browse, isPending };
}

export function BrowseAction({
  t: _t,
  icon: Icon,
  label,
  disabled,
}: PlaylistActionComponentProps) {
  const { browse, isPending } = useBrowseAction();

  return (
    <PlaylistActionButton
      disabled={disabled}
      isLoading={isPending}
      onClick={browse}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </PlaylistActionButton>
  );
}
