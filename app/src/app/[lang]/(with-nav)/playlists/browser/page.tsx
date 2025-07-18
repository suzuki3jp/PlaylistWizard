import { redirect } from "next/navigation";

import type { PageProps } from "@/@types";
import { MaxWidthContainer } from "@/presentation/common/max-width-container";
import { useServerT } from "@/presentation/hooks/t/server";
import { PlaylistBrowser } from "@/presentation/playlist-browser";

interface Props extends PageProps {}

export default async function ({ params, searchParams }: Props) {
  const { lang } = await params;
  const { ids } = await searchParams;
  const playlistIds = (ids?.split(",") || []).map((id) => id.trim());
  const { t } = await useServerT(lang);

  if (playlistIds.length === 0) {
    redirect(`/${lang}/playlists`); // Redirect to the main playlists page if no IDs are provided
  }

  return (
    <MaxWidthContainer className="min-h-screen">
      <main className="container py-8">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-2">
            <h1 className="font-bold text-3xl text-white">
              {t("playlist-browser.title")}
            </h1>
            <p className="text-gray-400">{t("playlist-browser.description")}</p>
          </div>

          <div
            className={`grid grid-cols-1 gap-6 ${playlistIds.length > 1 ? "lg:grid-cols-2" : ""}`}
          >
            {playlistIds.map((id) => (
              <PlaylistBrowser key={id} playlistId={id} />
            ))}
          </div>
        </div>
      </main>
    </MaxWidthContainer>
  );
}
