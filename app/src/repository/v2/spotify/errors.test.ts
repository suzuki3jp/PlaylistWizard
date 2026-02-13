import { describe, expect, it } from "vitest";
import { RepositoryError } from "../errors";
import { SpotifyRepositoryError } from "./errors";

describe("SpotifyRepositoryError", () => {
  it("should extend RepositoryError", () => {
    const error = SpotifyRepositoryError.fromHttpStatus(401);
    expect(error).toBeInstanceOf(RepositoryError);
    expect(error).toBeInstanceOf(SpotifyRepositoryError);
  });

  describe("fromHttpStatus", () => {
    it.each([
      [401, "UNAUTHORIZED", 401],
      [403, "FORBIDDEN", 403],
      [404, "NOT_FOUND", 404],
      [429, "TOO_MANY_REQUESTS", 429],
    ] as const)(
      "should map HTTP %i to %s",
      (httpStatus, expectedStatus, expectedCode) => {
        const error = SpotifyRepositoryError.fromHttpStatus(httpStatus);
        expect(error.status).toBe(expectedStatus);
        expect(error.code).toBe(expectedCode);
        expect(error.name).toBe("SpotifyRepositoryError");
      },
    );

    it("should map unknown HTTP status to UNKNOWN_ERROR", () => {
      const error = SpotifyRepositoryError.fromHttpStatus(500);
      expect(error.status).toBe("UNKNOWN_ERROR");
      expect(error.code).toBe(0);
    });
  });

  describe("validationError", () => {
    it("should create error with VALIDATION_ERROR status", () => {
      const error = SpotifyRepositoryError.validationError("invalid field");
      expect(error.status).toBe("VALIDATION_ERROR");
      expect(error.code).toBe(422);
      expect(error.message).toBe("ValidationError: invalid field");
    });
  });

  describe("unknownError", () => {
    it("should create error with default message", () => {
      const error = SpotifyRepositoryError.unknownError();
      expect(error.status).toBe("UNKNOWN_ERROR");
      expect(error.code).toBe(0);
      expect(error.message).toBe("UnknownError: an unknown error occurred");
    });

    it("should create error with custom message", () => {
      const error = SpotifyRepositoryError.unknownError("custom message");
      expect(error.status).toBe("UNKNOWN_ERROR");
      expect(error.code).toBe(0);
      expect(error.message).toBe("custom message");
    });
  });
});
