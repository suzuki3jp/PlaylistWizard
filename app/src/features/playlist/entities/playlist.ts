import { type PlaylistId, toPlaylistId } from "@/entities/ids";
import { Provider } from "@/entities/provider";
import type { PlaylistItem } from "./playlist-item";

export type Playlist = {
  id: PlaylistId;
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

type CreateDummyPlaylistInput = Partial<Omit<Playlist, "id">> & {
  id?: string;
};

export function createDummyPlaylist(data: CreateDummyPlaylistInput): Playlist {
  return {
    id: toPlaylistId(data.id ?? "dummy-id"),
    title: data.title ?? "Dummy Title",
    thumbnailUrl: data.thumbnailUrl ?? "https://example.com/thumbnail.jpg",
    itemsTotal: data.itemsTotal ?? 0,
    url: data.url ?? "https://example.com/playlist",
    provider: data.provider ?? Provider.GOOGLE,
  };
}
