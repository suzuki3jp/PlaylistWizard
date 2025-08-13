import { describe, expect, it } from "vitest";
import { hasDependencyCycle } from "./dependency";
import type { StructuredPlaylistDefinitionInterface } from "./types";

describe("hasDependencyCycle", () => {
  describe("no dependency cycles", () => {
    it("should return false for simple linear dependency", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        version: 1,
        name: "Linear Dependencies",
        provider: "spotify",
        user_id: "user123",
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              {
                id: "playlist2",
                dependencies: [{ id: "playlist3" }],
              },
            ],
          },
        ],
      };

      const result = hasDependencyCycle(definition);
      expect(result).toBe(false);
    });

    it("should return false for playlists without dependencies", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        version: 1,
        name: "No Dependencies",
        provider: "spotify",
        user_id: "user123",
        playlists: [{ id: "playlist1" }, { id: "playlist2" }],
      };

      const result = hasDependencyCycle(definition);
      expect(result).toBe(false);
    });

    it("should return false for complex DAG structure", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        version: 1,
        name: "DAG Structure",
        provider: "spotify",
        user_id: "user123",
        playlists: [
          {
            id: "root",
            dependencies: [
              {
                id: "branch1",
                dependencies: [{ id: "leaf1" }],
              },
              {
                id: "branch2",
                dependencies: [{ id: "leaf2" }],
              },
            ],
          },
        ],
      };

      const result = hasDependencyCycle(definition);
      expect(result).toBe(false);
    });
  });

  describe("dependency cycles detected", () => {
    it("should return true for simple self-referencing cycle", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        version: 1,
        name: "Self Reference Cycle",
        provider: "spotify",
        user_id: "user123",
        playlists: [
          {
            id: "playlist1",
            dependencies: [{ id: "playlist1" }], // Self reference
          },
        ],
      };

      const result = hasDependencyCycle(definition);
      expect(result).toBe(true);
    });

    it("should return true for simple two-node cycle", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        version: 1,
        name: "Two Node Cycle",
        provider: "spotify",
        user_id: "user123",
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              {
                id: "playlist2",
                dependencies: [{ id: "playlist1" }], // Cycle back to playlist1
              },
            ],
          },
        ],
      };

      const result = hasDependencyCycle(definition);
      expect(result).toBe(true);
    });

    it("should return true for complex cycle in larger graph", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        version: 1,
        name: "Complex Cycle",
        provider: "spotify",
        user_id: "user123",
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              {
                id: "playlist2",
                dependencies: [
                  {
                    id: "playlist3",
                    dependencies: [
                      {
                        id: "playlist4",
                        dependencies: [{ id: "playlist2" }], // Cycle back to playlist2
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = hasDependencyCycle(definition);
      expect(result).toBe(true);
    });
  });
});
