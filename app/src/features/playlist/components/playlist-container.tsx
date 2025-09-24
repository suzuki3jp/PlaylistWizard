"use client";
import { type PropsWithChildren, use } from "react";

import { useAuth } from "@/presentation/hooks/useAuth";
import { FetchMinePlaylistsUsecase } from "@/usecase/fetch-mine-playlists";
import { PlaylistsContextProvider } from "../contexts/playlists";
import { signOutWithCallbackToPlaylists } from "../utils/sign-out-with-callback-to-playlists";

export function PlaylistContainer({ children }: PropsWithChildren) {
  const auth = useAuth();

  if (!auth) return signOutWithCallbackToPlaylists();

  const playlistsResult = use(
    new FetchMinePlaylistsUsecase({
      accessToken: auth.accessToken,
      repository: auth.provider,
    }).execute(),
  );

  if (playlistsResult.isOk()) {
    // Successfully fetched playlists
    return (
      <PlaylistsContextProvider
        defaultPlaylists={Object.fromEntries(
          playlistsResult.value.map((p) => [p.id, p]),
        )}
      >
        {children}
      </PlaylistsContextProvider>
    );
  }

  if (playlistsResult.error.status === 404) {
    // No playlists found
    return (
      <PlaylistsContextProvider defaultPlaylists={{}}>
        {children}
      </PlaylistsContextProvider>
    );
  }

  // Other errors (e.g., 401 Unauthorized)
  return signOutWithCallbackToPlaylists();
}
