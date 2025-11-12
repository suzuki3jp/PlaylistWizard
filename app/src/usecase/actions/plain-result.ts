import type { SpotifyProviderErrorCode } from "@/repository/providers/spotify";
import type { YoutubeProviderErrorCode } from "@/repository/providers/youtube";

export const fail = (
  status: YoutubeProviderErrorCode | SpotifyProviderErrorCode,
): Failure => ({ status });
export const ok = <T>(data: T): Success<T> => ({ status: 200, data });

export type Result<T> = Success<T> | Failure;

interface Success<T> {
  status: 200;
  data: T;
}

export interface Failure {
  status: YoutubeProviderErrorCode | SpotifyProviderErrorCode;
}

export function isOk<T>(result: Result<T>): result is Success<T> {
  return result.status === 200;
}

export function isFail<T>(result: Result<T>): result is Failure {
  return result.status !== 200;
}
