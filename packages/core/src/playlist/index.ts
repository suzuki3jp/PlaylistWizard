import type { AccountId, PlaylistId, PlaylistItemId, VideoId } from "../ids";
import type { Provider } from "../provider";
import type { Thumbnail } from "../thumbnail";

export const PlaylistPrivacy = {
  Public: "public",
  Private: "private",
  Unlisted: "unlisted",
} as const;

export type PlaylistPrivacy =
  (typeof PlaylistPrivacy)[keyof typeof PlaylistPrivacy];

export type Playlist = {
  id: PlaylistId;
  accountId: AccountId;
  title: string;
  thumbnails: Thumbnail[];
  itemsTotal: number;
  url: string;
  provider: Provider;
};

export type PlaylistItem = {
  id: PlaylistItemId;
  title: string;
  thumbnails: Thumbnail[];
  position: number;
  author: string;
  videoId: VideoId;
  url: string;
};

export type FullPlaylist = Playlist & {
  items: PlaylistItem[];
};
