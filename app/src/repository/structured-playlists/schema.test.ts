// biome-ignore-all lint/suspicious/noDebugger: reason
/** biome-ignore-all lint/suspicious/noConsole: The console.log is needed for debugging */
import { describe, expect, it } from "vitest";

import {
  type StructuredPlaylistsDefinition,
  StructuredPlaylistsDefinitionSchema,
} from "./schema";

const validData: StructuredPlaylistsDefinition[] = [
  {
    version: 1,
    name: "My Playlist",
    provider: "spotify",
    playlists: [
      {
        id: "playlist-1",
        dependencies: [],
      },
      {
        id: "playlist-2",
        dependencies: [],
      },
    ],
  },
  {
    version: 1,
    name: "My Playlist",
    provider: "spotify",
    playlists: [
      {
        id: "playlist-1",
        dependencies: [
          {
            id: "playlist-2",
            dependencies: [],
          },
        ],
      },
    ],
  },
  {
    version: 1,
    name: "My Playlist",
    provider: "spotify",
    playlists: [
      {
        id: "playlist-1",
        dependencies: [
          {
            id: "playlist-2",
            dependencies: [
              {
                id: "playlist-3",
                dependencies: [],
              },
            ],
          },
        ],
      },
    ],
  },
];
const invalidData = [
  {},
  {
    name: "My Playlist",
    provider: "spotify",
    playlists: [],
  },
  {
    version: 1,
    provider: "spotify",
    playlists: [],
  },
  {
    version: 1,
    name: "My Playlist",
    playlists: [],
  },
  {
    version: 1,
    name: "My Playlist",
    provider: "spotify",
  },
];

describe("StructuredPlaylistsDefinitionSchema", () => {
  it("should validate valid data", () => {
    for (const validElement of validData) {
      const result =
        StructuredPlaylistsDefinitionSchema.safeParse(validElement);
      expect(result.success).toBe(true);

      if (!result.success) {
        console.error("================================");
        console.error("The Data should be valid, but it failed validation:");
        console.error(validElement);
        console.error(result.error);
        console.error("================================");
      }
    }
  });

  it("should invalidate invalid data", () => {
    invalidData.forEach((data) => {
      const result = StructuredPlaylistsDefinitionSchema.safeParse(data);
      expect(result.success).toBe(false);

      if (result.success) {
        console.error("================================");
        console.error("The Data should be invalid, but it passed validation:");
        console.error(data);
        console.error("================================");
      }
    });
  });
});
