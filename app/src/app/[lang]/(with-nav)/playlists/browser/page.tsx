import type { PageProps } from "@/lib/types/next";
import { PlaylistBrowserPage } from "@/presentation/pages/playlist-browser/indext";

interface Props extends PageProps {}

export default async function ({ params, searchParams }: Props) {
  const { lang } = await params;
  const playlistIds = await getPlaylistIds(searchParams);

  return <PlaylistBrowserPage playlistIds={playlistIds} lang={lang} />;
}

async function getPlaylistIds(searchParams: Props["searchParams"]) {
  const { ids } = await searchParams;
  if (Array.isArray(ids)) {
    return ids.map((id) => id.trim());
  }

  if (typeof ids === "string") {
    return ids.split(",").map((id) => id.trim());
  }

  return [];
}
