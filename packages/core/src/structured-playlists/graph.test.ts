import { describe, expect, it } from "vitest";
import type { StructuredPlaylistsDefinition } from "./schema";
import {
  groupByLevel,
  hasDependencyCycle,
  hasInvalidDependencies,
  listAllPaths,
  listPlaylistIds,
  planStructuredPlaylistsSyncSteps,
} from "./graph";

const baseDefinition: Omit<StructuredPlaylistsDefinition, "playlists"> = {
  version: 1,
  name: "Test Definition",
  provider: "google",
};

type PlaylistItem = {
  id: string;
  videoId: string;
};

type FullPlaylist = {
  id: string;
  items: PlaylistItem[];
};

describe("Structured Playlists Definition graph", () => {
  it("detects Dependency cycles across nested and sibling Playlist definitions", () => {
    const definition: StructuredPlaylistsDefinition = {
      ...baseDefinition,
      playlists: [
        {
          id: "playlist1",
          dependencies: [{ id: "playlist2" }],
        },
        {
          id: "playlist2",
          dependencies: [{ id: "playlist1" }],
        },
      ],
    };

    expect(hasDependencyCycle(definition)).toBe(true);
  });

  it("handles Playlist IDs that match object prototype property names", () => {
    const definition: StructuredPlaylistsDefinition = {
      ...baseDefinition,
      playlists: [
        {
          id: "__proto__",
          dependencies: [{ id: "constructor" }],
        },
        {
          id: "constructor",
          dependencies: [{ id: "__proto__" }],
        },
      ],
    };

    expect(hasDependencyCycle(definition)).toBe(true);
  });

  it("allows shared Dependencies when no cycle exists", () => {
    const definition: StructuredPlaylistsDefinition = {
      ...baseDefinition,
      playlists: [
        {
          id: "root1",
          dependencies: [{ id: "shared" }],
        },
        {
          id: "root2",
          dependencies: [{ id: "shared" }],
        },
      ],
    };

    expect(hasDependencyCycle(definition)).toBe(false);
  });

  it("detects duplicate sibling Dependencies and duplicate path entries", () => {
    expect(
      hasInvalidDependencies({
        ...baseDefinition,
        playlists: [
          {
            id: "playlist1",
            dependencies: [{ id: "playlist2" }, { id: "playlist2" }],
          },
        ],
      }),
    ).toBe(true);

    expect(
      hasInvalidDependencies({
        ...baseDefinition,
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              {
                id: "playlist2",
                dependencies: [{ id: "playlist1" }],
              },
            ],
          },
        ],
      }),
    ).toBe(true);
  });

  it("keeps traversal helpers stable for existing callers", () => {
    const roots = [
      {
        id: "root",
        dependencies: [
          {
            id: "a",
            dependencies: [{ id: "a1" }, { id: "a2" }],
          },
          { id: "b" },
        ],
      },
    ];

    expect(groupByLevel(roots)).toEqual([["root"], ["a", "b"], ["a1", "a2"]]);
    expect(listAllPaths(roots)).toEqual([
      ["root", "a", "a1"],
      ["root", "a", "a2"],
      ["root", "b"],
    ]);
  });

  it("lists Playlist IDs in first-seen traversal order with duplicates collapsed", () => {
    expect(
      listPlaylistIds([
        {
          id: "playlist1",
          dependencies: [{ id: "playlist2" }],
        },
        {
          id: "playlist1",
          dependencies: [{ id: "playlist2" }, { id: "playlist3" }],
        },
      ]),
    ).toEqual(["playlist1", "playlist2", "playlist3"]);
  });

  it("plans Sync add-item steps from Dependency Playlists without mutating target state", () => {
    const item1 = { id: "item1", videoId: "video1" };
    const duplicateVideo = { id: "item2", videoId: "video1" };
    const item3 = { id: "item3", videoId: "video3" };
    const playlists = [
      {
        id: "target",
        dependencies: [{ id: "source1" }, { id: "source2" }],
      },
    ];
    const playlistsMap = new Map<string, FullPlaylist>([
      ["target", { id: "target", items: [] }],
      ["source1", { id: "source1", items: [item1] }],
      ["source2", { id: "source2", items: [duplicateVideo, item3] }],
    ]);

    expect(
      planStructuredPlaylistsSyncSteps({
        getItems: (playlist) => playlist.items,
        getVideoId: (item) => item.videoId,
        playlists,
        playlistsMap,
        toPlaylistId: (playlistId) => playlistId,
      }),
    ).toEqual([
      {
        type: "add_item",
        playlistId: "target",
        item: item1,
        sourcePlaylistId: "source1",
      },
      {
        type: "add_item",
        playlistId: "target",
        item: duplicateVideo,
        sourcePlaylistId: "source2",
      },
      {
        type: "add_item",
        playlistId: "target",
        item: item3,
        sourcePlaylistId: "source2",
      },
    ]);
  });
});
