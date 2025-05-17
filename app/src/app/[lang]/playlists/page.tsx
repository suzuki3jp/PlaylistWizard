import type { SSRProps } from "@/@types";
import { PlaylistsRoot } from "@/components/playlists/playlists-root";
import { useServerT } from "@/i18n/server";

interface PlaylistsProps extends SSRProps {}

export default async function Playlists({ params }: PlaylistsProps) {
  const { lang } = await params;
  const { t } = await useServerT(lang);

  return (
    <main className="flex justify-center items-center">
      <div className="container px-4 py-8 flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-white">
            {t("playlists.title")}
          </h1>
          <p className="text-gray-400">{t("playlists.description")}</p>
        </div>

        <div className="flex flex-col space-y-6">
          <PlaylistsRoot lang={lang} />
        </div>
      </div>
    </main>
  );
}
