import { Provider } from "@/entities/provider";
import type { PlaylistItem } from "./playlist-item";

export type Playlist = {
  id: string;
  title: string;
  thumbnailUrl: string;
  itemsTotal: number;
  url: string;
  provider: Provider;
};

export type FullPlaylist = Playlist & {
  items: PlaylistItem[];
};

export enum PlaylistPrivacy {
  Public = "public",
  Private = "private",
  Unlisted = "unlisted",
}

export function createDummyPlaylist(data: Partial<Playlist>): Playlist {
  return {
    id: data.id ?? "dummy-id",
    title: data.title ?? "Dummy Title",
    thumbnailUrl: data.thumbnailUrl ?? "https://example.com/thumbnail.jpg",
    itemsTotal: data.itemsTotal ?? 0,
    url: data.url ?? "https://example.com/playlist",
    provider: data.provider ?? Provider.GOOGLE,
  };
}
