"use client";
import { type PropsWithChildren, use } from "react";

import { useAuth } from "@/presentation/hooks/useAuth";
import { FetchMinePlaylistsUsecase } from "@/usecase/fetch-mine-playlists";
import { PlaylistContextProvider } from "../contexts/playlist";
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
      <PlaylistContextProvider
        defaultPlaylists={Object.fromEntries(
          playlistsResult.value.map((p) => [p.id, p]),
        )}
      >
        {children}
      </PlaylistContextProvider>
    );
  }

  if (playlistsResult.error.status === 404) {
    // No playlists found
    return (
      <PlaylistContextProvider defaultPlaylists={{}}>
        {children}
      </PlaylistContextProvider>
    );
  }

  // Other errors (e.g., 401 Unauthorized)
  return signOutWithCallbackToPlaylists();
}
