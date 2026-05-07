import {
  type AccountId,
  type PlaylistId,
  toAccountId,
  toPlaylistId,
} from "@/entities/ids";
import { Provider } from "@/entities/provider";
import type { Thumbnail } from "@/entities/thumbnail";
import type { PlaylistItem } from "./playlist-item";

export type Playlist = {
  id: PlaylistId;
  accountId: AccountId;
  title: string;
  thumbnails: Thumbnail[];
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

type CreateDummyPlaylistInput = Partial<Omit<Playlist, "id" | "accountId">> & {
  id?: string;
  accountId?: string;
};

export function createDummyPlaylist(data: CreateDummyPlaylistInput): Playlist {
  return {
    id: toPlaylistId(data.id ?? "dummy-id"),
    accountId: toAccountId(data.accountId ?? "dummy-account-id"),
    title: data.title ?? "Dummy Title",
    thumbnails: data.thumbnails ?? [
      { url: "https://example.com/thumbnail.jpg", width: 640, height: 480 },
    ],
    itemsTotal: data.itemsTotal ?? 0,
    url: data.url ?? "https://example.com/playlist",
    provider: data.provider ?? Provider.GOOGLE,
  };
}
