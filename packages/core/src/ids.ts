declare const _userId: unique symbol;
export type UserId = string & { readonly [_userId]: never };
export const toUserId = (id: string): UserId => id as UserId;

declare const _accountId: unique symbol;
export type AccountId = string & { readonly [_accountId]: never };
export const toAccountId = (id: string): AccountId => id as AccountId;

declare const _providerAccountId: unique symbol;
export type ProviderAccountId = string & {
  readonly [_providerAccountId]: never;
};
export const toProviderAccountId = (id: string): ProviderAccountId =>
  id as ProviderAccountId;

declare const _playlistId: unique symbol;
export type PlaylistId = string & { readonly [_playlistId]: never };
export const toPlaylistId = (id: string): PlaylistId => id as PlaylistId;

declare const _playlistItemId: unique symbol;
export type PlaylistItemId = string & { readonly [_playlistItemId]: never };
export const toPlaylistItemId = (id: string): PlaylistItemId =>
  id as PlaylistItemId;

declare const _videoId: unique symbol;
export type VideoId = string & { readonly [_videoId]: never };
export const toVideoId = (id: string): VideoId => id as VideoId;
