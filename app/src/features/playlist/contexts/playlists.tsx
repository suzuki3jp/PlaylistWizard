"use client";
import { useRouter } from "next/navigation";
import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
  useState,
} from "react";
import { useLang } from "@/presentation/atoms";
import type { StateDispatcher } from "@/presentation/common/types";
import { isFail, isOk, ok, type Result } from "@/usecase/actions/plain-result";
import type { Playlist } from "../entities/playlist";

type PlaylistsResult = Result<Playlist[]>;

type PlaylistsContextType = {
  playlists: PlaylistsResult;
  setPlaylists: StateDispatcher<PlaylistsResult>;
};

const PlaylistsContext = createContext<PlaylistsContextType>({
  playlists: ok([]),
  setPlaylists: () => {
    throw new Error(
      "The PlaylistsContext#setPlaylists function called before the context was initialized. This is a bug.",
    );
  },
});

export function PlaylistsContextProvider({
  children,
  defaultPlaylists,
}: PropsWithChildren<{
  defaultPlaylists?: Promise<PlaylistsResult>;
}>) {
  const [playlists, setPlaylists] = useState<PlaylistsResult>(
    defaultPlaylists ? use(defaultPlaylists) : ok([]),
  );

  return (
    <PlaylistsContext.Provider value={{ playlists, setPlaylists }}>
      {children}
    </PlaylistsContext.Provider>
  );
}

export function usePlaylists(): {
  playlists: Playlist[];
  setPlaylists: PlaylistsContextType["setPlaylists"];
} {
  const [lang] = useLang();
  const router = useRouter();
  const { playlists, setPlaylists } = use(PlaylistsContext);

  useEffect(() => {
    if (isFail(playlists)) {
      if (playlists.status !== 404) {
        router.push(`/${lang}/sign-out?redirect_to=/playlists`);
      }
    }
  }, [playlists, router, lang]);

  if (isOk(playlists)) {
    return { playlists: playlists.data, setPlaylists };
  }

  return { playlists: [], setPlaylists };
}
