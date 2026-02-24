import type { Metadata } from "next";

import { PlaylistBrowserPage } from "@/features/playlist-browser";
import { useServerT } from "@/presentation/hooks/t/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/playlists/browser">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await useServerT(lang);

  return {
    title: t("playlist-browser.meta.title"),
    description: t("playlist-browser.meta.description"),
    openGraph: {
      title: t("playlist-browser.meta.title"),
      description: t("playlist-browser.meta.description"),
    },
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

  return <PlaylistBrowserPage playlistIds={playlistIds} lang={lang} />;
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
