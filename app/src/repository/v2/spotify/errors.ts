import { type ErrorStatus, RepositoryError } from "../errors";

const SpotifyErrors: Record<ErrorStatus, { code: number; message: string }> = {
  UNAUTHORIZED: {
    code: 401,
    message: "Unauthorized: invalid or expired access token",
  },
  FORBIDDEN: {
    code: 403,
    message: "Forbidden: permission denied",
  },
  NOT_FOUND: {
    code: 404,
    message: "NotFound: could not find the resource",
  },
  CONFLICT: {
    code: 409,
    message: "Conflict: resource conflict",
  },
  TOO_MANY_REQUESTS: {
    code: 429,
    message: "TooManyRequests: rate limit exceeded",
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

export class SpotifyRepositoryError extends RepositoryError {
  constructor(message: string, code: number, status: ErrorStatus) {
    super(message, code, status);
    this.name = "SpotifyRepositoryError";
  }

  static fromHttpStatus(status: number): SpotifyRepositoryError {
    const statusMap: Record<number, ErrorStatus> = {
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      429: "TOO_MANY_REQUESTS",
    };

    const errorStatus = statusMap[status] ?? "UNKNOWN_ERROR";
    const errorDef = SpotifyErrors[errorStatus];

    return new SpotifyRepositoryError(
      errorDef.message,
      errorDef.code,
      errorStatus,
    );
  }

  static validationError(message: string): SpotifyRepositoryError {
    return new SpotifyRepositoryError(
      `ValidationError: ${message}`,
      SpotifyErrors.VALIDATION_ERROR.code,
      "VALIDATION_ERROR",
    );
  }

  static unknownError(message?: string): SpotifyRepositoryError {
    return new SpotifyRepositoryError(
      message ?? SpotifyErrors.UNKNOWN_ERROR.message,
      SpotifyErrors.UNKNOWN_ERROR.code,
      "UNKNOWN_ERROR",
    );
  }
}
