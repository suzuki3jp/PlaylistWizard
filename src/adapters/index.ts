import { YouTubeAdapter } from "@/adapters/youtube/YouTubeAdapter";

export * from "@/adapters/entities";

export * from "@/adapters/youtube/YouTubeAdapter";

export type Adapters = YouTubeAdapter;

export type AdapterType = "YouTubeAdapter";

export function createAdapter(type: AdapterType): Adapters {
    switch (type) {
        case "YouTubeAdapter":
            return new YouTubeAdapter();
        default:
            throw new Error(`Unknown adapter type: ${type}`);
    }
}
