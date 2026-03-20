import { describe, expect, it } from "vitest";

import type { FullPlaylist, PlaylistItem } from "@/features/playlist/entities";
import { filterItemsToAdd, shouldAddItem } from "./index";

describe("shouldAddItem", () => {
  it("should return true if allowDuplicates is true", () => {
    const playlist = { items: [] } as unknown as FullPlaylist;
    const item = { id: "item1" } as unknown as PlaylistItem;
    expect(shouldAddItem(playlist, item, true)).toBe(true);
  });

  it("should return true if item does not exist in the playlist", () => {
    const playlist = {
      items: [{ videoId: "item1" }],
    } as unknown as FullPlaylist;
    const item = {
      videoId: "item2",
    } as unknown as PlaylistItem;
    expect(shouldAddItem(playlist, item, false)).toBe(true);
  });

  it("should return false if item already exists in the playlist and allowDuplicates is false", () => {
    const playlist = {
      items: [{ videoId: "item1" }],
    } as unknown as FullPlaylist;
    const item = {
      videoId: "item1",
    } as unknown as PlaylistItem;
    expect(shouldAddItem(playlist, item, false)).toBe(false);
  });
});

describe("filterItemsToAdd", () => {
  const item = (videoId: string) => ({ videoId }) as PlaylistItem;

  it("should return all items when allowDuplicates is true", () => {
    const source = [item("v1"), item("v1"), item("v2")];
    const target = [item("v1")];
    expect(filterItemsToAdd(source, target, true)).toEqual(source);
  });

  it("should skip items that already exist in the target", () => {
    const source = [item("v1"), item("v2")];
    const target = [item("v1")];
    expect(filterItemsToAdd(source, target, false)).toEqual([item("v2")]);
  });

  it("should deduplicate items within the source", () => {
    const source = [item("v1"), item("v2"), item("v1")];
    expect(filterItemsToAdd(source, [], false)).toEqual([
      item("v1"),
      item("v2"),
    ]);
  });

  it("should return all unique items when the target is empty", () => {
    const source = [item("v1"), item("v2")];
    expect(filterItemsToAdd(source, [], false)).toEqual(source);
  });

  it("should return an empty array when the source is empty", () => {
    expect(filterItemsToAdd([], [item("v1")], false)).toEqual([]);
  });
});
