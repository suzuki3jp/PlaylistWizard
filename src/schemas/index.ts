import { z } from "zod";

export const YouTubePlaylistIdSchema = z.string().refine(
    (id) => {
        const pattern = /^PL[a-zA-Z0-9_-]{32}$/;
        return pattern.test(id);
    },
    {
        message: "Invalid YouTube playlist ID format",
    },
);

export const YouTubePlaylistLinkSchema = z.string().refine(
    (url) => {
        try {
            const parsed = new URL(url);
            return (
                parsed.hostname === "www.youtube.com" &&
                ((parsed.pathname === "/playlist" &&
                    parsed.searchParams.has("list")) ||
                    (parsed.pathname === "/watch" &&
                        parsed.searchParams.has("list")))
            );
        } catch {
            return false;
        }
    },
    { message: "Invalid YouTube playlist URL" },
);
