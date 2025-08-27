import { describe, expect, it } from "vitest";
import type { DependencyNode } from "@/repository/structured-playlists/dependency";
import {
  groupByLevel,
  hasDependencyCycle,
  hasInvalidDependencies,
  listAllPaths,
} from "./dependency";
import type { StructuredPlaylistsDefinition } from "./schema";

const baseDefinition: Omit<StructuredPlaylistsDefinition, "playlists"> = {
  version: 1,
  name: "Test Definition",
  provider: "spotify",
};

describe("hasDependencyCycle", () => {
  describe("no cycles", () => {
    it("should return false for playlists with no dependencies", () => {
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
        ...baseDefinition,
        playlists: [],
      };

      expect(hasDependencyCycle(definition)).toBe(false);
    });

    it("should handle deeply nested dependencies without cycle", () => {
      const definition: StructuredPlaylistsDefinition = {
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
      const definition: StructuredPlaylistsDefinition = {
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

describe("hasInvalidDependencies", () => {
  describe("sibling dependencies", () => {
    it("should detect having sibling has same id", () => {
      const invalidDefinitions: StructuredPlaylistsDefinition[] = [
        {
          ...baseDefinition,
          playlists: [
            {
              id: "playlist1",
              dependencies: [
                {
                  id: "playlist2",
                },
              ],
            },
            {
              id: "playlist1",
            },
          ],
        },
        {
          ...baseDefinition,
          playlists: [
            {
              id: "playlist1",
              dependencies: [
                {
                  id: "playlist2",
                },
                {
                  id: "playlist2",
                },
              ],
            },
          ],
        },
      ];

      for (const definition of invalidDefinitions) {
        expect(hasInvalidDependencies(definition)).toBe(true);
      }
    });
  });

  describe("self dependencies", () => {
    it("should detect self dependencies", () => {
      const definitions: StructuredPlaylistsDefinition[] = [
        {
          ...baseDefinition,
          playlists: [
            {
              id: "playlist1",
              dependencies: [
                {
                  id: "playlist1",
                },
              ],
            },
          ],
        },
        {
          ...baseDefinition,
          playlists: [
            {
              id: "playlist2",
              dependencies: [
                {
                  id: "playlist1",
                  dependencies: [
                    {
                      id: "playlist2",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      for (const definition of definitions) {
        expect(hasInvalidDependencies(definition)).toBe(true);
      }
    });
  });
});

describe("groupByLevel", () => {
  it("returns correct levels for a single node", () => {
    const roots: StructuredPlaylistsDefinition["playlists"][number][] = [
      { id: "root" },
    ];
    expect(groupByLevel(roots)).toEqual([["root"]]);
  });

  it("returns correct levels for a two-level tree", () => {
    const roots: StructuredPlaylistsDefinition["playlists"][number][] = [
      {
        id: "root",
        dependencies: [{ id: "a" }, { id: "b" }],
      },
    ];
    expect(groupByLevel(roots)).toEqual([["root"], ["a", "b"]]);
  });

  it("returns correct levels for a three-level tree", () => {
    const roots: StructuredPlaylistsDefinition["playlists"][number][] = [
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
  });
});

describe("listAllPaths", () => {
  it("should return all paths from root to leaves", () => {
    const dependencies: DependencyNode[] = [
      {
        id: "a1",
        dependencies: [
          {
            id: "b1",
            dependencies: [{ id: "c1" }],
          },
          {
            id: "b2",
            dependencies: [{ id: "c2" }],
          },
        ],
      },
    ];

    expect(listAllPaths(dependencies)).toEqual([
      ["a1", "b1", "c1"],
      ["a1", "b2", "c2"],
    ]);
  });
});
