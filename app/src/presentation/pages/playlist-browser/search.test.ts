import { describe, expect, it } from "vitest";

import type { PrimitivePlaylistItemInterface } from "@/entity";
import { searchFilter } from "./browser";

describe("PlaylistBrowser search functionality", () => {
  const testItems: PrimitivePlaylistItemInterface[] = [
    {
      id: "1",
      title: "Rock Anthem",
      author: "Classic Rock Band",
      url: "https://example.com/1",
      thumbnailUrl: "https://example.com/thumb1.jpg",
      position: 0,
      videoId: "video1",
    },
    {
      id: "2",
      title: "Jazz Standard",
      author: "Modern Jazz Ensemble",
      url: "https://example.com/2",
      thumbnailUrl: "https://example.com/thumb2.jpg",
      position: 1,
      videoId: "video2",
    },
    {
      id: "3",
      title: "Pop Hit",
      author: "Popular Artist",
      url: "https://example.com/3",
      thumbnailUrl: "https://example.com/thumb3.jpg",
      position: 2,
      videoId: "video3",
    },
    {
      id: "4",
      title: "Classical Symphony",
      author: "Orchestra",
      url: "https://example.com/4",
      thumbnailUrl: "https://example.com/thumb4.jpg",
      position: 3,
      videoId: "video4",
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

  it("should support AND conditions with space-separated queries", () => {
    // Should match items that contain ALL search terms
    const rockItem = testItems[0]; // has "rock" in title and "classic" in author
    const jazzItem = testItems[1]; // has "jazz" in author but not "rock"
    const popItem = testItems[2]; // has neither

    const query = "rock classic";

    expect(searchFilter(rockItem, query)).toBe(true); // matches both "rock" and "classic"
    expect(searchFilter(jazzItem, query)).toBe(false); // only matches "jazz", not both
    expect(searchFilter(popItem, query)).toBe(false); // matches neither
  });

  it("should match partial words", () => {
    const result = searchFilter(testItems[3], "symph");
    expect(result).toBe(true);
  });

  it("should handle multiple spaces in query", () => {
    const result = searchFilter(testItems[0], "rock   classic");
    expect(result).toBe(true); // matches both "rock" and "classic"
  });

  it("should return false when no words match", () => {
    const result = searchFilter(testItems[0], "country blues");
    expect(result).toBe(false); // matches neither "country" nor "blues"
  });

  it("should work with complex multi-word AND queries", () => {
    // Test query: "rock band" should only match items that contain BOTH terms
    const query = "rock band";

    expect(searchFilter(testItems[0], query)).toBe(true); // matches both "rock" and "band"
    expect(searchFilter(testItems[1], query)).toBe(false); // matches neither
    expect(searchFilter(testItems[2], query)).toBe(false); // matches neither
    expect(searchFilter(testItems[3], query)).toBe(false); // matches neither
  });

  it("should return false when only some terms match", () => {
    // Test query: "rock modern" - testItems[0] has "rock" but not "modern"
    const query = "rock modern";

    expect(searchFilter(testItems[0], query)).toBe(false); // only matches "rock", not "modern"
    expect(searchFilter(testItems[1], query)).toBe(false); // only matches "modern", not "rock"
    expect(searchFilter(testItems[2], query)).toBe(false); // matches neither
    expect(searchFilter(testItems[3], query)).toBe(false); // matches neither
  });
});
