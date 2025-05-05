import { SpotifyAdapter } from "@/adapters/spotify/adapter";
import { YouTubeAdapter } from "@/adapters/youtube/adapter";
import type { AdapterType } from "@/helpers/providerToAdapterType";

export * from "@/adapters/entities";

export type Adapters = YouTubeAdapter | SpotifyAdapter;

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
