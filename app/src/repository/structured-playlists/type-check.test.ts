import { describe, expect, it } from "vitest";
import { checkFieldTypes } from "./type-check";

describe("checkFieldTypes", () => {
  const validDefinition = {
    version: 1,
    name: "Test Playlist Definition",
    provider: "spotify",
    user_id: "user123",
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
        id: "playlist3",
      },
    ],
  };

  describe("valid definitions", () => {
    it("should pass validation for a valid definition", () => {
      const result = checkFieldTypes(validDefinition);
      expect(result.isOk()).toBe(true);
    });

    it("should pass validation for playlists without dependencies", () => {
      const definition = {
        ...validDefinition,
        playlists: [{ id: "playlist1" }],
      };
      const result = checkFieldTypes(definition);
      expect(result.isOk()).toBe(true);
    });

    it("should pass validation for empty playlists array", () => {
      const definition = {
        ...validDefinition,
        playlists: [],
      };
      const result = checkFieldTypes(definition);
      expect(result.isOk()).toBe(true);
    });
  });

  describe("missing fields", () => {
    it("should fail when version is missing", () => {
      const { version, ...definition } = validDefinition;
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("MISSING_FIELD");
      }
    });

    it("should fail when name is missing", () => {
      const { name, ...definition } = validDefinition;
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("MISSING_FIELD");
      }
    });

    it("should fail when provider is missing", () => {
      const { provider, ...definition } = validDefinition;
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("MISSING_FIELD");
      }
    });

    it("should fail when user_id is missing", () => {
      const { user_id, ...definition } = validDefinition;
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("MISSING_FIELD");
      }
    });

    it("should fail when playlists is missing", () => {
      const { playlists, ...definition } = validDefinition;
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("MISSING_FIELD");
      }
    });
  });

  describe("invalid field types", () => {
    it("should fail for unsupported version", () => {
      const definition = { ...validDefinition, version: 2 };
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("UNSUPPORTED_VERSION");
      }
    });

    it("should fail for non-string name", () => {
      const definition = { ...validDefinition, name: 123 };
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_NAME");
      }
    });

    it("should fail for unsupported provider", () => {
      const definition = { ...validDefinition, provider: "apple" };
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_PROVIDER");
      }
    });

    it("should fail for non-string user_id", () => {
      const definition = { ...validDefinition, user_id: 123 };
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_USER_ID");
      }
    });

    it("should fail for non-array playlists", () => {
      const definition = { ...validDefinition, playlists: "not an array" };
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_PLAYLISTS");
      }
    });
  });

  describe("invalid playlist structures", () => {
    it("should fail for non-object playlist", () => {
      const definition = {
        ...validDefinition,
        playlists: ["not an object"],
      };
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_PLAYLIST_STRUCTURE");
      }
    });

    it("should fail for playlist without id", () => {
      const definition = {
        ...validDefinition,
        playlists: [{ name: "playlist without id" }],
      };
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_PLAYLIST_ID");
      }
    });

    it("should fail for non-string playlist id", () => {
      const definition = {
        ...validDefinition,
        playlists: [{ id: 123 }],
      };
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_PLAYLIST_ID");
      }
    });

    it("should fail for non-array dependencies", () => {
      const definition = {
        ...validDefinition,
        playlists: [
          {
            id: "playlist1",
            dependencies: "not an array",
          },
        ],
      };
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_PLAYLIST_DEPENDENCIES");
      }
    });

    it("should fail for invalid nested dependency structure", () => {
      const definition = {
        ...validDefinition,
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              {
                id: "valid-dependency",
              },
              "invalid dependency",
            ],
          },
        ],
      };
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_PLAYLIST_STRUCTURE");
      }
    });

    it("should fail for dependency without id", () => {
      const definition = {
        ...validDefinition,
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              {
                name: "dependency without id",
              },
            ],
          },
        ],
      };
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_PLAYLIST_ID");
      }
    });
  });

  describe("complex nested structures", () => {
    it("should validate deeply nested dependencies", () => {
      const definition = {
        ...validDefinition,
        playlists: [
          {
            id: "root",
            dependencies: [
              {
                id: "level1",
                dependencies: [
                  {
                    id: "level2",
                    dependencies: [
                      {
                        id: "level3",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = checkFieldTypes(definition);
      expect(result.isOk()).toBe(true);
    });

    it("should fail for invalid structure in deep nesting", () => {
      const definition = {
        ...validDefinition,
        playlists: [
          {
            id: "root",
            dependencies: [
              {
                id: "level1",
                dependencies: [
                  {
                    id: "level2",
                    dependencies: ["invalid nested structure"],
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = checkFieldTypes(definition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_PLAYLIST_STRUCTURE");
      }
    });
  });
});
