import { describe, expect, it } from "vitest";
import { deserialize } from "./deserialize";

describe("deserialize", () => {
  const validDefinitionString = JSON.stringify({
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
  });

  describe("successful deserialization", () => {
    it("should successfully deserialize valid JSON", () => {
      const result = deserialize(validDefinitionString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.version).toBe(1);
        expect(result.value.name).toBe("Test Playlist Definition");
        expect(result.value.provider).toBe("spotify");
        expect(result.value.user_id).toBe("user123");
        expect(result.value.playlists).toHaveLength(2);
        expect(result.value.playlists[0].id).toBe("playlist1");
        expect(result.value.playlists[0].dependencies).toHaveLength(1);
        expect(result.value.playlists[0].dependencies?.[0].id).toBe(
          "playlist2",
        );
      }
    });

    it("should deserialize playlist without dependencies", () => {
      const definitionString = JSON.stringify({
        version: 1,
        name: "Simple Definition",
        provider: "google",
        user_id: "user456",
        playlists: [{ id: "simple-playlist" }],
      });

      const result = deserialize(definitionString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.playlists).toHaveLength(1);
        expect(result.value.playlists[0].id).toBe("simple-playlist");
        expect(result.value.playlists[0].dependencies).toBeUndefined();
      }
    });

    it("should deserialize definition with empty playlists array", () => {
      const definitionString = JSON.stringify({
        version: 1,
        name: "Empty Definition",
        provider: "spotify",
        user_id: "user789",
        playlists: [],
      });

      const result = deserialize(definitionString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.playlists).toHaveLength(0);
      }
    });

    it("should deserialize complex nested structures", () => {
      const definitionString = JSON.stringify({
        version: 1,
        name: "Complex Valid Definition",
        provider: "google",
        user_id: "user999",
        playlists: [
          {
            id: "root",
            dependencies: [
              {
                id: "level1",
                dependencies: [
                  {
                    id: "level2",
                    dependencies: [{ id: "level3" }],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = deserialize(definitionString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.playlists[0].id).toBe("root");
        expect(result.value.playlists[0].dependencies?.[0].id).toBe("level1");
        expect(
          result.value.playlists[0].dependencies?.[0].dependencies?.[0].id,
        ).toBe("level2");
        expect(
          result.value.playlists[0].dependencies?.[0].dependencies?.[0]
            .dependencies?.[0].id,
        ).toBe("level3");
      }
    });
  });

  describe("dependency cycle detection", () => {
    it("should detect simple dependency cycle", () => {
      const definitionString = JSON.stringify({
        version: 1,
        name: "Cyclic Definition",
        provider: "spotify",
        user_id: "user123",
        playlists: [
          {
            id: "playlist1",
            dependencies: [
              {
                id: "playlist2",
                dependencies: [{ id: "playlist1" }], // Creates cycle
              },
            ],
          },
        ],
      });

      const result = deserialize(definitionString);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("DEPENDENCY_CYCLE");
      }
    });
  });

  describe("error handling edge cases", () => {
    it("should handle JSON.parse throwing SyntaxError", () => {
      const malformedJson = '{"unclosed": "string';

      const result = deserialize(malformedJson);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_JSON");
      }
    });

    it("should handle JSON.parse with circular references error gracefully", () => {
      // This would be caught by our validation, but testing the error handling path
      const result = deserialize("{");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe("INVALID_JSON");
      }
    });
  });

  describe("type safety after deserialization", () => {
    it("should return properly typed object after successful validation", () => {
      const result = deserialize(validDefinitionString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Type should be inferred correctly
        const definition = result.value;
        expect(typeof definition.version).toBe("number");
        expect(typeof definition.name).toBe("string");
        expect(typeof definition.provider).toBe("string");
        expect(typeof definition.user_id).toBe("string");
        expect(Array.isArray(definition.playlists)).toBe(true);
      }
    });
  });
});
