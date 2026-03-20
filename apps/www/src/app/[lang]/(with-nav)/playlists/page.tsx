import type { Metadata } from "next";

import { PlaylistsView } from "@/features/playlist/view";
import { useServerT } from "@/presentation/hooks/t/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/playlists">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await useServerT(lang);

  return {
    title: t("playlists.meta.title"),
    description: t("playlists.meta.description"),
    openGraph: {
      title: t("playlists.meta.title"),
      description: t("playlists.meta.description"),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ({ params }: PageProps<"/[lang]/playlists">) {
  const { lang } = await params;

  return <PlaylistsView lang={lang} />;
}
