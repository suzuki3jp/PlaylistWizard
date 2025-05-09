import { describe, expect, it } from "vitest";

import { YouTubePlaylistSpecifierValidator } from "./youtube-specifier";

describe("YouTubePlaylistSpecifierValidator", () => {
    describe("isValid", () => {
        it("should return true for valid YouTube specifiers", () => {
            const validIds = [
                "PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
                "https://youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
                "https://www.youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
            ];

            for (const id of validIds) {
                expect(YouTubePlaylistSpecifierValidator.isValid(id)).toBe(
                    true,
                );
            }
        });

        it("should return false for invalid YouTube specifiers", () => {
            const invalidIds = [
                "invalid-id",
                "https://example.com/watch?v=dQw4w9WgXcQ",
                "youtube:playlist:PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
            ];

            for (const id of invalidIds) {
                expect(YouTubePlaylistSpecifierValidator.isValid(id)).toBe(
                    false,
                );
            }
        });
    });

    describe("unique", () => {
        it("should return the ID for valid YouTube playlist IDs", () => {
            const validIds = [
                "PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
                "PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
            ];

            for (const id of validIds) {
                expect(YouTubePlaylistSpecifierValidator.unique(id)).toBe(id);
            }
        });

        it("should return the ID from a valid YouTube URL", () => {
            const validUrls = [
                "https://youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
                "https://www.youtube.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
            ];

            for (const url of validUrls) {
                expect(YouTubePlaylistSpecifierValidator.unique(url)).toBe(
                    "PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
                );
            }
        });

        it("should throw an error for invalid YouTube specifiers", () => {
            const invalidIds = [
                "invalid-id",
                "https://example.com/playlist?list=PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
                "youtube:playlist:PLHFlHpPjgk713fMv5O4s4Fv7k6yTkXwkV",
            ];

            for (const id of invalidIds) {
                expect(() =>
                    YouTubePlaylistSpecifierValidator.unique(id),
                ).toThrow(/Invalid YouTube specifier/);
            }
        });
    });
});
