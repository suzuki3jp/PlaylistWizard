import { describe, expect, it } from "vitest";

import { SpotifySpecifierValidator } from "@/lib/validator/spotify-specifier";

describe("SpotifySpecifierValidator", () => {
  describe("isValid", () => {
    it("should return true for valid Spotify specifiers", () => {
      const validIds = [
        "37i9dQZF1DXcBWIGoYBM5M",
        "37i9dQZF1DXcBWIGoYBM5M",
        "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
        "https://spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      ];

      for (const id of validIds) {
        expect(SpotifySpecifierValidator.isValid(id)).toBe(true);
      }
    });

    it("should return false for invalid Spotify specifiers", () => {
      const invalidIds = [
        "invalid-id",
        "https://example.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
        "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M",
      ];

      for (const id of invalidIds) {
        expect(SpotifySpecifierValidator.isValid(id)).toBe(false);
      }
    });
  });

  describe("unique", () => {
    it("should return the ID for valid Spotify IDs", () => {
      const validIds = ["37i9dQZF1DXcBWIGoYBM5M", "37i9dQZF1DXcBWIGoYBM5M"];

      for (const id of validIds) {
        expect(SpotifySpecifierValidator.unique(id)).toBe(id);
      }
    });

    it("should return the ID from a valid Spotify URL", () => {
      const validUrls = [
        "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
        "https://spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      ];

      for (const url of validUrls) {
        expect(SpotifySpecifierValidator.unique(url)).toBe(
          "37i9dQZF1DXcBWIGoYBM5M",
        );
      }
    });

    it("should throw an error for invalid Spotify specifiers", () => {
      const invalidIds = [
        "invalid-id",
        "https://example.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
        "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M",
      ];

      for (const id of invalidIds) {
        expect(() => SpotifySpecifierValidator.unique(id)).toThrow(
          /Invalid Spotify specifier/,
        );
      }
    });
  });
});
