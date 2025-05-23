import { describe, expect, it } from "vitest";

import { type RawThumbnails, Thumbnails } from "./Thumbnails";

describe("Thumbnails", () => {
  const mockThumbnailData = {
    url: "https://example.com/thumbnail.jpg",
    width: 120,
    height: 90,
  };

  const mockRawThumbnails: RawThumbnails = {
    default: mockThumbnailData,
    medium: { ...mockThumbnailData, width: 320, height: 180 },
    high: { ...mockThumbnailData, width: 480, height: 360 },
    standard: { ...mockThumbnailData, width: 640, height: 480 },
    maxres: { ...mockThumbnailData, width: 1280, height: 720 },
  };

  describe("getLargest", () => {
    it("returns maxres when all qualities are available", () => {
      const thumbnails = new Thumbnails(mockRawThumbnails);
      const largest = thumbnails.getLargest();
      expect(largest?.width).toBe(1280);
      expect(largest?.height).toBe(720);
    });

    it("returns next best quality when higher qualities are missing", () => {
      const thumbnails = new Thumbnails({
        ...mockRawThumbnails,
        maxres: undefined,
        high: undefined,
      });
      const largest = thumbnails.getLargest();
      expect(largest?.width).toBe(320);
    });

    it("returns null when no thumbnails are available", () => {
      const thumbnails = new Thumbnails({});
      expect(thumbnails.getLargest()).toBeNull();
    });
  });

  describe("getSmallest", () => {
    it("returns default when all qualities are available", () => {
      const thumbnails = new Thumbnails(mockRawThumbnails);
      const smallest = thumbnails.getSmallest();
      expect(smallest?.width).toBe(120);
      expect(smallest?.height).toBe(90);
    });

    it("returns next available quality when default is missing", () => {
      const thumbnails = new Thumbnails({
        ...mockRawThumbnails,
        default: undefined,
      });
      const smallest = thumbnails.getSmallest();
      expect(smallest?.width).toBe(640);
    });
  });

  describe("getByQuality", () => {
    it("returns the correct thumbnail for specified quality", () => {
      const thumbnails = new Thumbnails(mockRawThumbnails);
      const medium = thumbnails.getByQuality("medium");
      expect(medium?.width).toBe(320);
      expect(medium?.height).toBe(180);
    });

    it("returns null for missing quality", () => {
      const thumbnails = new Thumbnails({
        ...mockRawThumbnails,
        medium: undefined,
      });
      expect(thumbnails.getByQuality("medium")).toBeNull();
    });
  });
});
