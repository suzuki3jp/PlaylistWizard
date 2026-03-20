import { describe, expect, it } from "vitest";
import { YouTubePlaylistIdentifier } from "./playlist-identifiers";

describe("YouTubePlaylistIdentifier", () => {
  describe("isValid", () => {
    it("should return true for valid YouTube specifiers", () => {
      const validIds = [
        "PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
        "https://youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
        "https://www.youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
      ];

      for (const id of validIds) {
        expect(YouTubePlaylistIdentifier.isValid(id)).toBe(true);
      }
    });

    it("should return true for watch URL with list parameter", () => {
      expect(
        YouTubePlaylistIdentifier.isValid(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
        ),
      ).toBe(true);
    });

    it("should return true for http (non-HTTPS) URL", () => {
      expect(
        YouTubePlaylistIdentifier.isValid(
          "http://www.youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
        ),
      ).toBe(true);
    });

    it("should return true for URL with additional query parameters", () => {
      expect(
        YouTubePlaylistIdentifier.isValid(
          "https://www.youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV&index=5",
        ),
      ).toBe(true);
    });

    it("should return false for invalid YouTube specifiers", () => {
      const invalidIds = [
        "invalid-id",
        "https://example.com/watch?v=dQw4w9WgXcQ",
        "youtube:playlist:PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
      ];

      for (const id of invalidIds) {
        expect(YouTubePlaylistIdentifier.isValid(id)).toBe(false);
      }
    });
  });

  describe("id", () => {
    it("should return the ID for valid YouTube playlist IDs", () => {
      const validIds = [
        "PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
        "PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
      ];

      for (const id of validIds) {
        expect(YouTubePlaylistIdentifier.from(id)?.id()).toBe(id);
      }
    });

    it("should return the ID from a valid YouTube URL", () => {
      const validUrls = [
        "https://youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
        "https://www.youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
      ];

      for (const url of validUrls) {
        expect(YouTubePlaylistIdentifier.from(url)?.id()).toBe(
          "PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
        );
      }
    });

    it("should extract ID from watch URL with list parameter", () => {
      expect(
        YouTubePlaylistIdentifier.from(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
        )?.id(),
      ).toBe("PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV");
    });

    it("should extract ID from http (non-HTTPS) URL", () => {
      expect(
        YouTubePlaylistIdentifier.from(
          "http://www.youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
        )?.id(),
      ).toBe("PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV");
    });

    it("should extract ID from URL with additional query parameters", () => {
      expect(
        YouTubePlaylistIdentifier.from(
          "https://www.youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV&index=5",
        )?.id(),
      ).toBe("PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV");
    });

    it("should return null for invalid YouTube specifiers", () => {
      const invalidIds = [
        "invalid-id",
        "https://example.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
        "youtube:playlist:PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
      ];

      for (const id of invalidIds) {
        expect(YouTubePlaylistIdentifier.from(id)?.id()).toBeUndefined();
      }
    });
  });

  describe("from", () => {
    it("should return non-null for valid inputs", () => {
      expect(
        YouTubePlaylistIdentifier.from("PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV"),
      ).not.toBeNull();
      expect(
        YouTubePlaylistIdentifier.from(
          "https://www.youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
        ),
      ).not.toBeNull();
    });

    it("should return null for invalid inputs", () => {
      expect(YouTubePlaylistIdentifier.from("invalid")).toBeNull();
    });
  });
});
