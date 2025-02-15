import { YouTubeAdapter } from "@/adapters/YouTubeAdapter";

export * from "@/adapters/entities";

export * from "@/adapters/YouTubeAdapter";

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
