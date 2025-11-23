import { describe, expect, it } from "vitest";

import type { FullPlaylist, PlaylistItem } from "@/features/playlist/entities";
import { shouldAddItem } from "./index";

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
