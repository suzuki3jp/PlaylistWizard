export type ErrorStatus =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

export abstract class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly status: ErrorStatus,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}
