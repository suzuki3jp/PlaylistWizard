import { BaseAdapterError } from "@/lib/base-adapter";

export class YoutubeAdapterError extends BaseAdapterError {
    constructor(
        message: ErrorMessage,
        public readonly code: ErrorCode,
        public readonly status: ErrorStatus,
    ) {
        super(message, code, status);
        this.name = "YoutubeAdapterError";
    }

    static fromUnkwonError() {}
}

/**
 * Make a YouTubeAdapterError instance from the given error status.
 * @param name
 * @returns
 */
export function makeError(name: ErrorStatus) {
    return new YoutubeAdapterError(
        YoutubeAdapterErrorCodes[name].message,
        YoutubeAdapterErrorCodes[name].code,
        name,
    );
}

export const YoutubeAdapterErrorCodes = {
    UNAUTHORIZED: {
        code: 401,
        message: "Unauthorized: invalid access_token",
    },
    /**
     * クォータ制限の時はこのコードが返されるかも
     */
    FORBIDDEN: {
        code: 403,
        message: "Forbidden: permission denied",
    },
    NOT_FOUND: {
        code: 404,
        message: "NotFound: could not find the resource",
    },
    /**
     * playlistItems.insert とかでたまにこのエラーが発生する。
     * 同じ条件でも安定して発生するわけではないので、おそらくリクエストの間隔が短すぎることが原因？
     */
    CONFLICT: {
        code: 409,
        message: "Conflict: resource already exist",
    },
    TOO_MANY_REQUESTS: {
        code: 429,
        message: "TooManyRequests: Youtube API daily quota exceeded",
    },
    UNKNOWN_ERROR: {
        code: 0,
        message: "UnknownError: An unknown error occurred during the request",
    },
} as const;

type ErrorCode =
    (typeof YoutubeAdapterErrorCodes)[keyof typeof YoutubeAdapterErrorCodes]["code"];

type ErrorMessage =
    (typeof YoutubeAdapterErrorCodes)[keyof typeof YoutubeAdapterErrorCodes]["message"];

type ErrorStatus = keyof typeof YoutubeAdapterErrorCodes;
