import { useServerT } from "@/presentation/hooks/t/server";
import { Playlists } from "./playlists";

interface PlaylistsPageProps {
  lang: string;
}

export async function PlaylistsPage({ lang }: PlaylistsPageProps) {
  const { t } = await useServerT(lang);

  return (
    <main className="flex items-center justify-center">
      <div className="container flex min-h-screen flex-col space-y-6 px-4 py-8">
        <div className="flex flex-col space-y-2">
          <h1 className="font-bold text-3xl text-white">
            {t("playlists.title")}
          </h1>
          <p className="text-gray-400">{t("playlists.description")}</p>
        </div>

        <div className="flex flex-col space-y-6">
          <Playlists />
        </div>
      </div>
    </main>
  );
}
