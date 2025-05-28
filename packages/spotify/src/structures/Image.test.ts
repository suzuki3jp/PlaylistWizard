import { describe, expect, it } from "vitest";

import { Image, Images, type RawImage } from "./Image";

describe("Image", () => {
  describe("constructor", () => {
    it("should create an Image instance with correct properties", () => {
      const rawImage: RawImage = {
        url: "https://example.com/image.jpg",
        height: 300,
        width: 400,
      };

      const image = new Image(rawImage);

      expect(image.url).toBe(rawImage.url);
      expect(image.height).toBe(rawImage.height);
      expect(image.width).toBe(rawImage.width);
    });
  });

  describe("getSize", () => {
    it("should return height * width when both exist", () => {
      const image = new Image({
        url: "https://example.com/image.jpg",
        height: 300,
        width: 400,
      });

      expect(image.getSize()).toBe(120000);
    });

    it("should return null when height or width is null", () => {
      const image = new Image({
        url: "https://example.com/image.jpg",
        height: null,
        width: 400,
      });

      expect(image.getSize()).toBeNull();
    });
  });
});

describe("Images", () => {
  describe("getLargest", () => {
    it("should return largest image by size", () => {
      const images = new Images([
        new Image({ url: "small.jpg", height: 100, width: 100 }),
        new Image({ url: "large.jpg", height: 300, width: 300 }),
        new Image({ url: "medium.jpg", height: 200, width: 200 }),
      ]);

      const largest = images.getLargest();
      expect(largest?.url).toBe("large.jpg");
    });

    it("should return null for empty array", () => {
      const images = new Images([]);
      expect(images.getLargest()).toBeNull();
    });
  });

  describe("getSmallest", () => {
    it("should return smallest image by size", () => {
      const images = new Images([
        new Image({ url: "small.jpg", height: 100, width: 100 }),
        new Image({ url: "large.jpg", height: 300, width: 300 }),
        new Image({ url: "medium.jpg", height: 200, width: 200 }),
      ]);

      const smallest = images.getSmallest();
      expect(smallest?.url).toBe("small.jpg");
    });

    it("should return null for empty array", () => {
      const images = new Images([]);
      expect(images.getSmallest()).toBeNull();
    });
  });

  describe("getAll", () => {
    it("should return all images sorted by size in descending order", () => {
      const images = new Images([
        new Image({ url: "small.jpg", height: 100, width: 100 }),
        new Image({ url: "large.jpg", height: 300, width: 300 }),
        new Image({ url: "medium.jpg", height: 200, width: 200 }),
      ]);

      const all = images.getAll();
      expect(all.map((img) => img.url)).toEqual([
        "large.jpg",
        "medium.jpg",
        "small.jpg",
      ]);
    });
  });
});
