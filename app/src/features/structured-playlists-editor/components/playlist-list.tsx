"use client";
import type { WithT } from "i18next";
import { Music } from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { type DragEvent, useEffect } from "react";
import { Loading } from "@/components/loading";
import type { Playlist } from "@/features/playlist/entities";
import { makeLocalizedUrl } from "@/presentation/common/makeLocalizedUrl";
import { useAuth } from "@/presentation/hooks/useAuth";
import { FetchMinePlaylistsUsecase } from "@/usecase/fetch-mine-playlists";
import type { PlaylistFetchState } from "./editor";

interface PlaylistListProps {
  lang: string;
  playlistFetchState: PlaylistFetchState;
}

export function PlaylistList({
  lang,
  t,
  playlistFetchState: [loading, playlists, setPlaylistsAsFetched],
}: PlaylistListProps & WithT) {
  const auth = useAuth();

  useEffect(() => {
    const fetchPlaylists = async () => {
      function signOutWithRedirect() {
        signOut({
          callbackUrl: makeLocalizedUrl(
            lang,
            "/sign-in?redirect_to=/structured-playlists/editor",
          ),
        });
      }

      if (auth === null) return signOutWithRedirect();
      if (!auth) return;

      const playlists = await new FetchMinePlaylistsUsecase({
        accessToken: auth.accessToken,
        repository: auth.provider,
      }).execute();

      if (playlists.isErr() && playlists.error.status === 404)
        return setPlaylistsAsFetched(null);
      if (playlists.isErr()) return signOutWithRedirect();

      setPlaylistsAsFetched(playlists.value);
    };

    fetchPlaylists();
  }, [auth, setPlaylistsAsFetched, lang]);

  return (
    <div className="lg:col-span-1">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-4 font-semibold text-lg text-white">
          {t("editor.available-playlists.title")}
        </h3>
        <p className="mb-4 text-gray-400 text-sm">
          {t("editor.available-playlists.description")}
        </p>

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {!loading && playlists ? (
            playlists.map((playlist) => (
              <PlaylistCard playlist={playlist} key={playlist.id} t={t} />
            ))
          ) : loading ? (
            <Loading />
          ) : (
            <div className="py-8 text-center text-gray-400">
              <p>プレイリストがないか、取得に失敗しました。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaylistCard({ playlist, t }: { playlist: Playlist } & WithT) {
  function handleDragStart(e: DragEvent) {
    if (!e.dataTransfer)
      // biome-ignore lint/suspicious/noConsole: Should display an error message
      return console.error("PlaylistCard: DataTransfer is not supported");

    e.dataTransfer.setData("application/json", JSON.stringify(playlist));
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div
      className="cursor-grab rounded-lg border border-gray-700 bg-gray-800 p-3 transition-colors hover:border-gray-600 active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
      role="application"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
          <Image
            src={playlist.thumbnailUrl || "/assets/ogp.png"}
            alt={playlist.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-medium text-sm text-white">
            {playlist.title}
          </h4>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Music className="h-3 w-3" />
              <span>
                {t("editor.song-count", { count: playlist.itemsTotal })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
