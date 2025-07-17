import type { StructuredPlaylistDefinitionInterface } from "@/usecase/interface/structured-playlists";
import { describe, expect, it } from "vitest";
import { hasDependencyCycle } from "./dependency";

describe("hasDependencyCycle", () => {
  const baseDefinition: Omit<
    StructuredPlaylistDefinitionInterface,
    "playlists"
  > = {
    version: 1,
    name: "Test Definition",
    provider: "spotify",
    user_id: "user123",
  };

  describe("no cycles", () => {
    it("should return false for playlists with no dependencies", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          { id: "playlist1" },
          { id: "playlist2" },
          { id: "playlist3" },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(false);
    });

    it("should return false for linear dependencies", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
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

      expect(hasDependencyCycle(definition)).toBe(false);
    });

    it("should return false for tree-like dependencies", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          {
            id: "root",
            dependencies: [
              {
                id: "branch1",
                dependencies: [{ id: "leaf1" }, { id: "leaf2" }],
              },
              {
                id: "branch2",
                dependencies: [{ id: "leaf3" }],
              },
            ],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(false);
    });

    it("should return false for multiple independent trees", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          {
            id: "tree1",
            dependencies: [{ id: "tree1-child1" }, { id: "tree1-child2" }],
          },
          {
            id: "tree2",
            dependencies: [{ id: "tree2-child1" }],
          },
          { id: "standalone" },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(false);
    });
  });

  describe("direct cycles", () => {
    it("should detect self-dependency", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              { id: "playlist1" }, // Self-dependency
            ],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(true);
    });

    it("should detect two-node cycle", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              {
                id: "playlist2",
                dependencies: [
                  { id: "playlist1" }, // Cycle back to playlist1
                ],
              },
            ],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(true);
    });
  });

  describe("complex cycles", () => {
    it("should detect three-node cycle", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
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
                      { id: "playlist1" }, // Cycle back to playlist1
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(true);
    });

    it("should detect cycle in complex dependency graph", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          {
            id: "root",
            dependencies: [
              {
                id: "branch1",
                dependencies: [
                  { id: "leaf1" },
                  {
                    id: "problematic",
                    dependencies: [
                      { id: "branch1" }, // Cycle back to branch1
                    ],
                  },
                ],
              },
              { id: "branch2" },
            ],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(true);
    });

    it("should detect cycle when multiple paths lead to same node", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          {
            id: "root",
            dependencies: [
              {
                id: "shared",
                dependencies: [
                  { id: "root" }, // Cycle back to root
                ],
              },
              {
                id: "branch",
                dependencies: [
                  { id: "shared" }, // Also depends on shared
                ],
              },
            ],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(true);
    });

    it("should detect cycle when playlists are defined separately at same level", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              { id: "playlist2" }, // playlist1 -> playlist2
            ],
          },
          {
            id: "playlist2",
            dependencies: [
              { id: "playlist1" }, // playlist2 -> playlist1 (creates cycle)
            ],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(true);
    });

    it("should detect multi-node cycle when playlists are defined separately", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              { id: "playlist2" }, // playlist1 -> playlist2
            ],
          },
          {
            id: "playlist2",
            dependencies: [
              { id: "playlist3" }, // playlist2 -> playlist3
            ],
          },
          {
            id: "playlist3",
            dependencies: [
              { id: "playlist1" }, // playlist3 -> playlist1 (creates cycle)
            ],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(true);
    });

    it("should detect complex cycle with mix of nested and separate definitions", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          {
            id: "root",
            dependencies: [
              { id: "separate1" }, // root -> separate1
            ],
          },
          {
            id: "separate1",
            dependencies: [
              { id: "separate2" }, // separate1 -> separate2
            ],
          },
          {
            id: "separate2",
            dependencies: [
              { id: "root" }, // separate2 -> root (creates cycle)
            ],
          },
          {
            id: "independent",
            dependencies: [{ id: "leaf" }],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(true);
    });
  });

  describe("mixed scenarios", () => {
    it("should detect cycle even when other parts of graph are valid", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          // Valid tree
          {
            id: "valid-root",
            dependencies: [{ id: "valid-child1" }, { id: "valid-child2" }],
          },
          // Cyclic tree
          {
            id: "cyclic-root",
            dependencies: [
              {
                id: "cyclic-child",
                dependencies: [
                  { id: "cyclic-root" }, // Creates cycle
                ],
              },
            ],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(true);
    });

    it("should return false when no cycles exist in complex graph", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          {
            id: "root1",
            dependencies: [
              {
                id: "shared-dependency",
                dependencies: [{ id: "leaf1" }, { id: "leaf2" }],
              },
            ],
          },
          {
            id: "root2",
            dependencies: [
              { id: "shared-dependency" }, // Same dependency, but no cycle
            ],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should return false for empty playlists array", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [],
      };

      expect(hasDependencyCycle(definition)).toBe(false);
    });

    it("should handle deeply nested dependencies without cycle", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          {
            id: "level0",
            dependencies: [
              {
                id: "level1",
                dependencies: [
                  {
                    id: "level2",
                    dependencies: [
                      {
                        id: "level3",
                        dependencies: [{ id: "level4" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(false);
    });

    it("should detect cycle in deeply nested dependencies", () => {
      const definition: StructuredPlaylistDefinitionInterface = {
        ...baseDefinition,
        playlists: [
          {
            id: "level0",
            dependencies: [
              {
                id: "level1",
                dependencies: [
                  {
                    id: "level2",
                    dependencies: [
                      {
                        id: "level3",
                        dependencies: [
                          { id: "level0" }, // Cycle back to root
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      expect(hasDependencyCycle(definition)).toBe(true);
    });
  });
});
