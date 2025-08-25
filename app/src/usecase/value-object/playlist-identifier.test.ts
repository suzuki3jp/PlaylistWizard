import { describe, expect, it } from "vitest";
import {
  SpotifyPlaylistIdentifier,
  YouTubePlaylistIdentifier,
} from "./playlist-identifiers";

describe("SpotifyPlaylistIdentifier", () => {
  describe("isValid", () => {
    it("should return true for valid Spotify identifiers", () => {
      const validIds = [
        "37i9dQZF1DXcBWIGoYBM5M",
        "37i9dQZF1DXcBWIGoYBM5M",
        "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
        "https://spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      ];

      for (const id of validIds) {
        expect(SpotifyPlaylistIdentifier.isValid(id)).toBe(true);
      }
    });

    it("should return false for invalid Spotify identifiers", () => {
      const invalidIds = [
        "invalid-id",
        "https://example.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
        "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M",
      ];

      for (const id of invalidIds) {
        expect(SpotifyPlaylistIdentifier.isValid(id)).toBe(false);
      }
    });
  });

  describe("id", () => {
    it("should return the ID for valid Spotify IDs", () => {
      const validIds = ["37i9dQZF1DXcBWIGoYBM5M", "37i9dQZF1DXcBWIGoYBM5M"];

      for (const id of validIds) {
        expect(SpotifyPlaylistIdentifier.from(id)?.id()).toBe(id);
      }
    });

    it("should return the ID from a valid Spotify URL", () => {
      const validUrls = [
        "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
        "https://spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      ];

      for (const url of validUrls) {
        expect(SpotifyPlaylistIdentifier.from(url)?.id()).toBe(
          "37i9dQZF1DXcBWIGoYBM5M",
        );
      }
    });

    it("should return null for invalid Spotify identifiers", () => {
      const invalidIds = [
        "invalid-id",
        "https://example.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
        "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M",
      ];

      for (const id of invalidIds) {
        expect(SpotifyPlaylistIdentifier.from(id)?.id()).toBeUndefined();
      }
    });
  });
});

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
});
