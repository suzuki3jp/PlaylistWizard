import type { SpotifyErrorCodes, YoutubeErrorCodes } from "./typings";

export const fail = (
    status: YoutubeErrorCodes | SpotifyErrorCodes,
): Failure => ({ status });
export const ok = <T>(data: T): Success<T> => ({ status: 200, data });

export type Result<T> = Success<T> | Failure;

interface Success<T> {
    status: 200;
    data: T;
}

export interface Failure {
    status: YoutubeErrorCodes | SpotifyErrorCodes;
}
