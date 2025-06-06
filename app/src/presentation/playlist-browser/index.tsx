"use client";
import {
  SiSpotify as Spotify,
  SiYoutubemusic as YouTubeMusic,
} from "@icons-pack/react-simple-icons";
import { Music, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import type { WithT } from "@/@types";
import type { FullPlaylist } from "@/entity";
import { Link } from "@/presentation/common/link";
import { makeLocalizedUrl } from "@/presentation/common/makeLocalizedUrl";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Button } from "@/presentation/shadcn/button";
import { Input } from "@/presentation/shadcn/input";
import { Skeleton } from "@/presentation/shadcn/skeleton";
import { FetchFullPlaylistUsecase } from "@/usecase/fetch-full-playlist";

interface PlaylistBrowserProps {
  lang: string;
  playlistId: string;
}

export function PlaylistBrowser({ lang, playlistId }: PlaylistBrowserProps) {
  const { t } = useT(lang);
  const [searchQuery, setSearchQuery] = useState("");
  const auth = useAuth();
  const [playlist, setPlaylist] = useState<FullPlaylist | null>(null);

  const fetchFullPlaylist = useCallback(async () => {
    if (!auth) return;
    const playlist = await new FetchFullPlaylistUsecase({
      playlistId,
      accessToken: auth.accessToken,
      repository: auth.provider,
    }).execute();
    if (playlist.isOk()) {
      setPlaylist(playlist.value);
    } else if (playlist.error.status === 404) {
    } else {
      signOut({ callbackUrl: makeLocalizedUrl(lang, "/sign-in") });
    }
  }, [lang, auth, playlistId]);

  useEffect(() => {
    fetchFullPlaylist();
  }, [fetchFullPlaylist]);

  function searchFilter(item: FullPlaylist["items"][number]) {
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.author.toLowerCase().includes(query)
    );
  }

  const filterdItems = playlist?.items.filter(searchFilter) || [];

  return playlist ? (
    <div
      key={playlist.id}
      className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900 shadow-lg"
    >
      <div className="flex items-center justify-between border-gray-800 border-b p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-pink-600 p-2">
            <Music className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xl">{playlist.title}</h2>
            <p className="text-gray-400 text-sm">
              {t("playlist-browser.songs", { count: filterdItems.length })}
            </p>
          </div>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t("playlist-browser.search-placeholder")}
            className="border-gray-700 bg-gray-800 pl-8 text-white selection:bg-pink-500 focus:border-pink-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="relative max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-20 bg-gray-800">
            <tr>
              <th className="w-12 bg-gray-800 p-3 text-left font-medium text-gray-400 text-xs uppercase tracking-wider">
                #
              </th>
              <th className="bg-gray-800 p-3 text-left font-medium text-gray-400 text-xs uppercase tracking-wider">
                {t("common.title")}
              </th>
              <th className="w-12 bg-gray-800 p-3 text-right font-medium text-gray-400 text-xs uppercase tracking-wider">
                <span className="sr-only">{t("common.platform")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filterdItems.map((item, index) => (
              <tr
                key={item.id}
                className="group transition-colors hover:bg-gray-800/50"
              >
                <td className="whitespace-nowrap p-3 font-medium text-gray-300 text-sm">
                  {index + 1}
                </td>
                <td className="p-3">
                  <div className="flex items-center">
                    <div className="relative mr-3 h-10 w-10 flex-shrink-0 overflow-hidden rounded">
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-white">
                        {item.title}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {item.author.replace(/\s*- Topic$/, "")}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={item.url} openInNewTab>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {auth?.provider === "google" ? (
                          <YouTubeMusic className="h-5 w-5 text-red-600" />
                        ) : (
                          <Spotify className="h-5 w-5 text-[#1DB954]" />
                        )}
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : (
    <PlaylistBrowserSkeleton t={t} />
  );
}

function PlaylistBrowserSkeleton({ t }: WithT) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900 shadow-lg">
      <div className="flex items-center justify-between border-gray-800 border-b p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="relative w-full max-w-xs">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      <div className="relative max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-20 bg-gray-800">
            <tr>
              <th className="w-12 bg-gray-800 p-3 text-left font-medium text-gray-400 text-xs uppercase tracking-wider">
                #
              </th>
              <th className="bg-gray-800 p-3 text-left font-medium text-gray-400 text-xs uppercase tracking-wider">
                {t("common.title")}
              </th>
              <th className="w-12 bg-gray-800 p-3 text-right font-medium text-gray-400 text-xs uppercase tracking-wider">
                <span className="sr-only">{t("common.platform")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {Array(10)
              .fill(0)
              .map((_, index) => (
                <tr
                  key={`skeleton-item-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    index
                  }`}
                  className="bg-gray-800/50"
                >
                  <td className="p-3">
                    <Skeleton className="h-4 w-4" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center">
                      <Skeleton className="mr-3 h-10 w-10 rounded" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
