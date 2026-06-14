import { toAccountId, toPlaylistId } from "@playlistwizard/core/ids";
import type { Playlist } from "@playlistwizard/core/playlist";
import { Provider } from "@playlistwizard/core/provider";

export type { FullPlaylist, Playlist } from "@playlistwizard/core/playlist";
export { PlaylistPrivacy } from "@playlistwizard/core/playlist";

type CreateDummyPlaylistInput = Partial<Omit<Playlist, "id" | "accountId">> & {
  id?: string;
  accountId?: string;
};

export function createDummyPlaylist(data: CreateDummyPlaylistInput): Playlist {
  return {
    accountId: toAccountId(data.accountId ?? "dummy-account-id"),
    id: toPlaylistId(data.id ?? "dummy-id"),
    itemsTotal: data.itemsTotal ?? 0,
    provider: data.provider ?? Provider.GOOGLE,
    thumbnails: data.thumbnails ?? [
      { height: 480, url: "https://example.com/thumbnail.jpg", width: 640 },
    ],
    title: data.title ?? "Dummy Title",
    url: data.url ?? "https://example.com/playlist",
  };
}
