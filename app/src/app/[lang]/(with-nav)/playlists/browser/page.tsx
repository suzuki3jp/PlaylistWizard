import type { Metadata } from "next";
import { cache } from "react";

import type { Playlist } from "@/features/playlist/entities";
import { PlaylistBrowserPage } from "@/features/playlist-browser";
import { getAccessToken } from "@/lib/user";
import { useServerT } from "@/presentation/hooks/t/server";
import { YouTubeRepository } from "@/repository/v2/youtube/repository";

const fetchPlaylistsMetadata = cache(
  async (idsKey: string): Promise<Playlist[] | undefined> => {
    const playlistIds = idsKey ? idsKey.split(",") : [];
    if (playlistIds.length === 0) return undefined;
    try {
      const accessToken = await getAccessToken("google");
      if (!accessToken) return undefined;
      const repo = new YouTubeRepository(accessToken);
      const result = await repo.getPlaylistsByIds(playlistIds);
      return result.isOk() ? result.value : undefined;
    } catch {
      return undefined;
    }
  },
);

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[lang]/playlists/browser">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await useServerT(lang);
  const playlistIds = await getPlaylistIds(searchParams);
  const playlists = await fetchPlaylistsMetadata(playlistIds.join(","));

  const title =
    playlists && playlists.length > 0
      ? t("playlist-browser.meta.title-with-names", {
          names: playlists.map((p) => p.title).join(", "),
        })
      : t("playlist-browser.meta.title");
  const description = t("playlist-browser.meta.description");

  return {
    title,
    description,
    openGraph: { title, description },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ({
  params,
  searchParams,
}: PageProps<"/[lang]/playlists/browser">) {
  const { lang } = await params;
  const playlistIds = await getPlaylistIds(searchParams);
  const playlists = await fetchPlaylistsMetadata(playlistIds.join(","));
  const metadataMap = new Map(playlists?.map((p) => [p.id, p]) ?? []);

  return (
    <PlaylistBrowserPage
      playlistIds={playlistIds}
      lang={lang}
      metadataMap={metadataMap}
    />
  );
}

async function getPlaylistIds(
  searchParams: PageProps<"/[lang]/playlists/browser">["searchParams"],
) {
  const { ids } = await searchParams;
  if (Array.isArray(ids)) {
    return ids.map((id) => id.trim());
  }

  if (typeof ids === "string") {
    return ids.split(",").map((id) => id.trim());
  }

  return [];
}
