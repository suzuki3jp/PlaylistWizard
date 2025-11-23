import { PlaylistBrowserPage } from "@/features/playlist-browser";

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
