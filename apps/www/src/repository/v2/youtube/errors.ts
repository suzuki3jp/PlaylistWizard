import { type ErrorStatus, RepositoryError } from "../errors";

const YouTubeErrors: Record<ErrorStatus, { code: number; message: string }> = {
  UNAUTHORIZED: {
    code: 401,
    message: "Unauthorized: invalid access_token",
  },
  FORBIDDEN: {
    code: 403,
    message: "Forbidden: permission denied or quota exceeded",
  },
  NOT_FOUND: {
    code: 404,
    message: "NotFound: could not find the resource",
  },
  CONFLICT: {
    code: 409,
    message: "Conflict: resource already exists",
  },
  TOO_MANY_REQUESTS: {
    code: 429,
    message: "TooManyRequests: YouTube API quota exceeded",
  },
  VALIDATION_ERROR: {
    code: 422,
    message: "ValidationError: response validation failed",
  },
  UNKNOWN_ERROR: {
    code: 0,
    message: "UnknownError: an unknown error occurred",
  },
};

export class YouTubeRepositoryError extends RepositoryError {
  constructor(message: string, code: number, status: ErrorStatus) {
    super(message, code, status);
    this.name = "YouTubeRepositoryError";
  }

  static fromHttpStatus(status: number): YouTubeRepositoryError {
    const statusMap: Record<number, ErrorStatus> = {
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      429: "TOO_MANY_REQUESTS",
    };

    const errorStatus = statusMap[status] ?? "UNKNOWN_ERROR";
    const errorDef = YouTubeErrors[errorStatus];

    return new YouTubeRepositoryError(
      errorDef.message,
      errorDef.code,
      errorStatus,
    );
  }

  static validationError(message: string): YouTubeRepositoryError {
    return new YouTubeRepositoryError(
      `ValidationError: ${message}`,
      YouTubeErrors.VALIDATION_ERROR.code,
      "VALIDATION_ERROR",
    );
  }

  static unknownError(message?: string): YouTubeRepositoryError {
    return new YouTubeRepositoryError(
      message ?? YouTubeErrors.UNKNOWN_ERROR.message,
      YouTubeErrors.UNKNOWN_ERROR.code,
      "UNKNOWN_ERROR",
    );
  }
}
