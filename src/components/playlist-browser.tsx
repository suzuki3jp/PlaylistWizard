import type React from "react";

import { useServerT } from "@/hooks";
import type { PageProps } from "@/types";
import { PlaylistItemsViewer } from "./playlist-items-viewer";
import { Text } from "./ui/text";

/**
 * The PlaylistBrowser section of the home page (`/`).
 */
export const PlaylistBrowser: React.FC<PlaylistBrowserProps> = async ({
    searchParams,
}) => {
    const { t } = await useServerT(searchParams);

    const { id } = await searchParams;
    const playlistIds = typeof id === "string" ? id.split(",") : id;
    if (!playlistIds) return null;

    return (
        <section className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">
                {t("playlist-browser.title")}
            </h2>
            <Text className="!m-0">{t("playlist-browser.description")}</Text>

            <div
                className={`grid gap-6 md:grid-cols-${playlistIds.length > 2 ? 3 : playlistIds.length}`}
            >
                {playlistIds.map((id) => (
                    <PlaylistItemsViewer key={id} id={id} />
                ))}
            </div>
        </section>
    );
};

export type PlaylistBrowserProps = Readonly<PageProps>;
