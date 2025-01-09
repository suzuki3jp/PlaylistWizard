import { getServerSession } from "next-auth";
import type React from "react";

import { useServerT } from "@/hooks";
import type { PageProps } from "@/types";
import { PlaylistsGrid } from "./playlists-grid";
import { Text } from "./text";

/**
 * The YourPlaylists section of the home page (`/`).
 * @param param0
 * @returns
 */
export const YourPlaylists: React.FC<YourPlaylistsProps> = async ({
    searchParams,
}) => {
    const { t } = await useServerT(searchParams);

    const session = await getServerSession();
    if (!session) return null;

    return (
        <section className="space-y-6">
            {
                // TODO: Add a tooltip to the right of the title for more information.
                // https://mui.com/material-ui/material-icons/?srsltid=AfmBOopBEzV679SBeIAjtJaXppUE6ymsIEGml2riVCuuk5szZp-7OI1m&query=info&selected=Info
            }
            <h2 className="text-3xl font-bold tracing-tight">
                {t("your-playlists.title")}
            </h2>
            <Text className="!m-0">{t("your-playlists.description")}</Text>

            <PlaylistsGrid />
        </section>
    );
};

export type YourPlaylistsProps = Readonly<PageProps>;
