import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { PropsWithChildren } from "react";

import { OPTIONS } from "@/app/api/auth/[...nextauth]/nextAuthOptions";
import { PlaylistsContextProvider } from "../contexts/playlists";
import { SelectedPlaylistsContextProvider } from "../contexts/selected-playlists";
import { getMinePlaylists } from "../get-mine-playlists";

interface PlaylistsContainerProps {
  lang: string;
}

export async function PlaylistsContainer({
  children,
  lang,
}: PropsWithChildren<PlaylistsContainerProps>) {
  const session = await getServerSession(OPTIONS);

  if (!session?.accessToken || !session.provider)
    return redirectToSignOut(lang);

  const playlistsResult = getMinePlaylists(
    session.accessToken,
    session.provider,
  );

  return (
    <PlaylistsContextProvider defaultPlaylists={playlistsResult}>
      <SelectedPlaylistsContextProvider>
        {children}
      </SelectedPlaylistsContextProvider>
    </PlaylistsContextProvider>
  );
}

function redirectToSignOut(lang: string) {
  return redirect(`/${lang}/sign-out?redirect_to=/playlists`);
}
