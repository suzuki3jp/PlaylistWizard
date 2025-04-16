import { z } from "zod";

export const YouTubePlaylistIdPattern = /^PL[a-zA-Z0-9_-]{32}$/;
export const YouTubePlaylistUrlPattern =
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:playlist\?list=|watch\?.*?&list=)[a-zA-Z0-9_-]+(?:&.*)?$/;

export const YouTubePlaylistSpecifierSchema = z.string().refine((specifier) => {
    try {
        return (
            YouTubePlaylistIdPattern.test(specifier) ||
            YouTubePlaylistUrlPattern.test(specifier)
        );
    } catch (error) {
        return false;
    }
});
