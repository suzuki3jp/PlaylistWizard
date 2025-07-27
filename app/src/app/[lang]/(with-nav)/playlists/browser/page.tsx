import type { PageProps } from "@/lib/types/next";
import { PlaylistBrowserPage } from "@/presentation/pages/playlist-browser/indext";

interface Props extends PageProps {}

export default async function ({ params, searchParams }: Props) {
  const { lang } = await params;
  const { ids } = await searchParams;
  const playlistIds = (ids?.split(",") || []).map((id) => id.trim());

  return <PlaylistBrowserPage playlistIds={playlistIds} lang={lang} />;
}
