import type { Metadata } from "next";

import { getPinnedPlaylistIds } from "@/features/pinned-playlists/actions";
import { PinnedPlaylistsProvider } from "@/features/pinned-playlists/provider";
import { SearchView } from "@/features/search/view";
import { useServerT } from "@/presentation/hooks/t/server";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[lang]/search">): Promise<Metadata> {
  const { lang } = await params;
  const { q } = await searchParams;
  const { t } = await useServerT(lang, "search");

  const query = Array.isArray(q) ? q[0] : q;
  const title = query ? t("meta.title-with-query", { query }) : t("meta.title");

  return {
    title,
    description: t("meta.description"),
    openGraph: {
      title,
      description: t("meta.description"),
    },
  };
}

export default async function () {
  const initialPinnedIds = await getPinnedPlaylistIds();
  return (
    <PinnedPlaylistsProvider initialIds={initialPinnedIds}>
      <SearchView />
    </PinnedPlaylistsProvider>
  );
}
