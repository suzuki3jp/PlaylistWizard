import { SpotifyAdapter } from "@/adapters/spotify/SpotifyAdapter";
import { YouTubeAdapter } from "@/adapters/youtube/YouTubeAdapter";

export * from "@/adapters/entities";

export * from "@/adapters/youtube/YouTubeAdapter";

export type Adapters = YouTubeAdapter | SpotifyAdapter;

export type AdapterType = "YouTubeAdapter" | "SpotifyAdapter";

export function createAdapter(type: AdapterType): Adapters {
    switch (type) {
        case "YouTubeAdapter":
            return new YouTubeAdapter();
        case "SpotifyAdapter":
            return new SpotifyAdapter();
        default:
            throw new Error(`Unknown adapter type: ${type}`);
    }
}
