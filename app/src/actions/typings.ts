import type { SpotifyAdapterErrorCode } from "@/adapters/spotify/adapter";
import type { YoutubeAdapterErrorCodes } from "@/adapters/youtube/adapter";

export type YoutubeErrorCodes =
  (typeof YoutubeAdapterErrorCodes)[keyof typeof YoutubeAdapterErrorCodes]["code"];
export type SpotifyErrorCodes =
  (typeof SpotifyAdapterErrorCode)[keyof typeof SpotifyAdapterErrorCode]["code"];
