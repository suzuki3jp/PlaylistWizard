import { describe, expect, it } from "vitest";
import { searchFilter } from "./index";

// Test data type that matches the structure used in the component
type PlaylistItem = {
  id: string;
  title: string;
  author: string;
  url: string;
  thumbnailUrl: string;
};

describe("PlaylistBrowser search functionality", () => {
  const testItems: PlaylistItem[] = [
    {
      id: "1",
      title: "Rock Anthem",
      author: "Classic Rock Band",
      url: "https://example.com/1",
      thumbnailUrl: "https://example.com/thumb1.jpg",
    },
    {
      id: "2",
      title: "Jazz Standard",
      author: "Modern Jazz Ensemble",
      url: "https://example.com/2",
      thumbnailUrl: "https://example.com/thumb2.jpg",
    },
    {
      id: "3",
      title: "Pop Hit",
      author: "Popular Artist",
      url: "https://example.com/3",
      thumbnailUrl: "https://example.com/thumb3.jpg",
    },
    {
      id: "4",
      title: "Classical Symphony",
      author: "Orchestra",
      url: "https://example.com/4",
      thumbnailUrl: "https://example.com/thumb4.jpg",
    },
  ];

  it("should return true for empty search query", () => {
    const result = searchFilter(testItems[0], "");
    expect(result).toBe(true);
  });

  it("should return true for whitespace-only search query", () => {
    const result = searchFilter(testItems[0], "   ");
    expect(result).toBe(true);
  });

  it("should match single word in title", () => {
    const result = searchFilter(testItems[0], "rock");
    expect(result).toBe(true);
  });

  it("should match single word in author", () => {
    const result = searchFilter(testItems[0], "classic");
    expect(result).toBe(true);
  });

  it("should be case insensitive", () => {
    const result1 = searchFilter(testItems[0], "ROCK");
    const result2 = searchFilter(testItems[0], "Classic");
    expect(result1).toBe(true);
    expect(result2).toBe(true);
  });

  it("should support OR conditions with space-separated queries", () => {
    // Should match items with either "rock" OR "jazz"
    const rockItem = testItems[0]; // has "rock" in title
    const jazzItem = testItems[1]; // has "jazz" in author
    const popItem = testItems[2]; // has neither

    const query = "rock jazz";

    expect(searchFilter(rockItem, query)).toBe(true);
    expect(searchFilter(jazzItem, query)).toBe(true);
    expect(searchFilter(popItem, query)).toBe(false);
  });

  it("should match partial words", () => {
    const result = searchFilter(testItems[3], "symph");
    expect(result).toBe(true);
  });

  it("should handle multiple spaces in query", () => {
    const result = searchFilter(testItems[0], "rock   classic");
    expect(result).toBe(true);
  });

  it("should return false when no words match", () => {
    const result = searchFilter(testItems[0], "country blues");
    expect(result).toBe(false);
  });

  it("should work with complex multi-word OR queries", () => {
    // Test query: "rock modern popular" should match items 0, 1, and 2
    const query = "rock modern popular";

    expect(searchFilter(testItems[0], query)).toBe(true); // matches "rock"
    expect(searchFilter(testItems[1], query)).toBe(true); // matches "modern"
    expect(searchFilter(testItems[2], query)).toBe(true); // matches "popular"
    expect(searchFilter(testItems[3], query)).toBe(false); // matches none
  });
});
