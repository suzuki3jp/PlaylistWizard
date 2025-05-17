import type { SSRProps } from "@/@types";
import { PlaylistBrowser } from "@/components/playlist-browser";
import { useServerT } from "@/i18n/server";

interface Props extends SSRProps {}

export default async function ({ params, searchParams }: Props) {
    const { lang } = await params;
    const { ids } = await searchParams;
    const playlistIds = (ids?.split(",") || []).map((id) => id.trim());
    const { t } = await useServerT(lang);

    return (
        <div className="flex items-center justify-center">
            <main className="container px-4 py-8">
                <div className="flex flex-col space-y-6">
                    <div className="flex flex-col space-y-2">
                        <h1 className="text-3xl font-bold text-white">
                            {t("playlist-browser.title")}
                        </h1>
                        <p className="text-gray-400">
                            {t("playlist-browser.description")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {playlistIds.map((id) => (
                            <PlaylistBrowser
                                key={id}
                                lang={lang}
                                playlistId={id}
                            />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
