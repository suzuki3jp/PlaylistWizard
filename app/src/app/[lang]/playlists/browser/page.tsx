import type { SSRProps } from "@/@types";
import { PlaylistBrowser } from "@/components/playlist-browser";
import { MaxWidthContainer } from "@/features/common/components/max-width-container";
import { useServerT } from "@/features/localization/hooks/server";

interface Props extends SSRProps {}

export default async function ({ params, searchParams }: Props) {
  const { lang } = await params;
  const { ids } = await searchParams;
  const playlistIds = (ids?.split(",") || []).map((id) => id.trim());
  const { t } = await useServerT(lang);

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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {playlistIds.map((id) => (
              <PlaylistBrowser key={id} lang={lang} playlistId={id} />
            ))}
          </div>
        </div>
      </main>
    </MaxWidthContainer>
  );
}
