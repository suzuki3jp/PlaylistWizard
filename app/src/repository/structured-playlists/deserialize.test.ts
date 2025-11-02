import { describe, expect, it } from "vitest";
import { Provider } from "@/entities/provider";
import {
  deserialize,
  StructuredPlaylistsDefinitionDeserializeErrorCode,
} from "./deserialize";

describe("deserialize", () => {
  const validDefinitionString = JSON.stringify({
    version: 1,
    name: "Test Playlist Definition",
    provider: "spotify",
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
        provider: Provider.GOOGLE,
        playlists: [{ id: "simple-playlist" }],
      });

      const result = deserialize(definitionString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.playlists[0].dependencies).toBeUndefined();
      }
    });

    it("should deserialize empty playlists array", () => {
      const definitionString = JSON.stringify({
        version: 1,
        name: "Empty Definition",
        provider: "spotify",
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
        provider: Provider.GOOGLE,
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

  describe("JSON parsing errors", () => {
    it("should fail for invalid JSON syntax", () => {
      const invalidJson = `{
        "version": 1,
        "name": "Test",
        "provider": "spotify"
        "playlists": []
      }`;

      const result = deserialize(invalidJson);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          StructuredPlaylistsDefinitionDeserializeErrorCode.INVALID_JSON,
        );
      }
    });

    it("should fail for completely malformed JSON", () => {
      const result = deserialize("not json at all");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          StructuredPlaylistsDefinitionDeserializeErrorCode.INVALID_JSON,
        );
      }
    });

    it("should fail for empty string", () => {
      const result = deserialize("");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          StructuredPlaylistsDefinitionDeserializeErrorCode.INVALID_JSON,
        );
      }
    });

    it("should fail for null input as string", () => {
      const result = deserialize("null");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          StructuredPlaylistsDefinitionDeserializeErrorCode.VALIDATION_ERROR,
        );
      }
    });

    it("should handle various JSON primitive types correctly", () => {
      const primitives = ["123", "true", "false", '"string"', "[]", "{}"];

      for (const primitive of primitives) {
        const result = deserialize(primitive);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          // Should fail at field validation stage, not JSON parsing
          expect(result.error.code).toBe(
            StructuredPlaylistsDefinitionDeserializeErrorCode.VALIDATION_ERROR,
          );
        }
      }
    });
  });

  describe("integration with validation functions", () => {
    it("should call type checking and fail for field type errors", () => {
      const invalidFieldTypes = JSON.stringify({
        version: "1", // should be number
        name: "Test",
        provider: "spotify",
        playlists: [],
      });

      const result = deserialize(invalidFieldTypes);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          StructuredPlaylistsDefinitionDeserializeErrorCode.VALIDATION_ERROR,
        );
      }
    });

    it("should call dependency cycle detection and fail for cycles", () => {
      const cyclicDefinition = JSON.stringify({
        version: 1,
        name: "Test",
        provider: "spotify",
        playlists: [
          {
            id: "playlist1",
            dependencies: [{ id: "playlist1" }], // self-dependency cycle
          },
        ],
      });

      const result = deserialize(cyclicDefinition);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          StructuredPlaylistsDefinitionDeserializeErrorCode.DEPENDENCY_CYCLE,
        );
      }
    });
  });

  describe("error handling edge cases", () => {
    it("should handle JSON.parse throwing SyntaxError", () => {
      const malformedJson = '{"unclosed": "string';

      const result = deserialize(malformedJson);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          StructuredPlaylistsDefinitionDeserializeErrorCode.INVALID_JSON,
        );
      }
    });

    it("should handle JSON.parse with circular references error gracefully", () => {
      // This would be caught by our validation, but testing the error handling path
      const result = deserialize("{");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          StructuredPlaylistsDefinitionDeserializeErrorCode.INVALID_JSON,
        );
      }
    });
  });

  describe("type safety after deserialization", () => {
    it("should return properly typed object after successful validation", () => {
      const result = deserialize(validDefinitionString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // TypeScript should recognize these as properly typed
        const definition = result.value;
        expect(typeof definition.version).toBe("number");
        expect(typeof definition.name).toBe("string");
        expect(typeof definition.provider).toBe("string");
        expect(Array.isArray(definition.playlists)).toBe(true);

        // Test nested structure typing
        if (definition.playlists[0].dependencies) {
          expect(typeof definition.playlists[0].dependencies[0].id).toBe(
            "string",
          );
        }
      }
    });

    it("should handle optional dependencies field correctly", () => {
      const definitionWithAndWithoutDeps = JSON.stringify({
        version: 1,
        name: "Mixed Dependencies",
        provider: "spotify",
        playlists: [
          {
            id: "with-deps",
            dependencies: [{ id: "dep1" }],
          },
          {
            id: "without-deps",
            // no dependencies field
          },
        ],
      });

      const result = deserialize(definitionWithAndWithoutDeps);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.playlists[0].dependencies).toBeDefined();
        expect(result.value.playlists[0].dependencies).toHaveLength(1);
        expect(result.value.playlists[1].dependencies).toBeUndefined();
      }
    });
  });
});
