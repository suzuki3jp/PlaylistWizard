import type { Metadata } from "next";

import { StructuredPlaylistEditorView } from "@/features/structured-playlists-editor/view";
import { useServerT } from "@/presentation/hooks/t/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/structured-playlists/editor">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await useServerT(lang, "structured-playlists");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default StructuredPlaylistEditorView;
