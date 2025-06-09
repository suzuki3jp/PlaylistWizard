import type { StructuredPlaylistDefinitionInterface } from "@/usecase/interface/structured-playlists";
import { describe, expect, it } from "vitest";
import { StructuredPlaylistDefinitionJson } from "./index";

const parser = new StructuredPlaylistDefinitionJson();

describe("StructuredPlaylistDefinitionJson", () => {
  const validJson: StructuredPlaylistDefinitionInterface = {
    version: 1,
    name: "My Playlist",
    provider: "spotify",
    user_id: "user123",
    playlists: [
      {
        id: "playlist1",
        dependencies: [{ id: "playlist2" }],
      },
      {
        id: "playlist2",
      },
    ],
  };

  it("should deserialize valid JSON", () => {
    const result = parser.deserialize(JSON.stringify(validJson));
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toMatchObject(validJson);
    }
  });

  it("should fail on invalid JSON", () => {
    const result = parser.deserialize("{invalid json}");
    expect(result.isErr()).toBe(true);
  });

  it("should fail if required fields are missing", () => {
    const { version, ...missingVersion } = validJson;
    const result = parser.deserialize(JSON.stringify(missingVersion));
    expect(result.isErr()).toBe(true);
  });

  it("should fail if version is not 1", () => {
    const invalid = { ...validJson, version: 2 };
    const result = parser.deserialize(JSON.stringify(invalid));
    expect(result.isErr()).toBe(true);
  });

  it("should fail if name is not a string", () => {
    const invalid = { ...validJson, name: 123 };
    const result = parser.deserialize(JSON.stringify(invalid));
    expect(result.isErr()).toBe(true);
  });

  it("should fail if provider is invalid", () => {
    const invalid = { ...validJson, provider: "apple" };
    const result = parser.deserialize(JSON.stringify(invalid));
    expect(result.isErr()).toBe(true);
  });

  it("should fail if user_id is not a string", () => {
    const invalid = { ...validJson, user_id: 123 };
    const result = parser.deserialize(JSON.stringify(invalid));
    expect(result.isErr()).toBe(true);
  });

  it("should fail if playlists is not an array", () => {
    const invalid = { ...validJson, playlists: "not-an-array" };
    const result = parser.deserialize(JSON.stringify(invalid));
    expect(result.isErr()).toBe(true);
  });

  it("should fail if a playlist is missing id", () => {
    const invalid = {
      ...validJson,
      playlists: [{ dependencies: [] }],
    };
    const result = parser.deserialize(JSON.stringify(invalid));
    expect(result.isErr()).toBe(true);
  });

  it("should fail if a playlist id is not a string", () => {
    const invalid = {
      ...validJson,
      playlists: [{ id: 123 }],
    };
    const result = parser.deserialize(JSON.stringify(invalid));
    expect(result.isErr()).toBe(true);
  });

  it("should fail if dependencies is not an array", () => {
    const invalid = {
      ...validJson,
      playlists: [{ id: "playlist1", dependencies: "not-an-array" }],
    };
    const result = parser.deserialize(JSON.stringify(invalid));
    expect(result.isErr()).toBe(true);
  });

  it("isValidDefinition returns true for valid definition", () => {
    expect(parser.isValidDefinition(validJson)).toBe(true);
  });

  it("isValidDefinition returns false for invalid definition", () => {
    const invalid = { ...validJson, version: 2 };
    expect(parser.isValidDefinition(invalid)).toBe(false);
  });

  describe("noDependencyCycle", () => {
    it("returns ok when there is no dependency cycle", () => {
      const noCycle: StructuredPlaylistDefinitionInterface = {
        version: 1,
        name: "No Cycle",
        provider: "spotify",
        user_id: "user123",
        playlists: [
          { id: "a", dependencies: [{ id: "b" }] },
          { id: "b", dependencies: [{ id: "c" }] },
          { id: "c" },
        ],
      };
      expect(parser.noDependencyCycle(noCycle).isOk()).toBe(true);
    });

    it("returns err when there is a self-referential playlist", () => {
      const selfRef: StructuredPlaylistDefinitionInterface = {
        version: 1,
        name: "Self Reference",
        provider: "spotify",
        user_id: "user123",
        playlists: [
          { id: "a", dependencies: [{ id: "b", dependencies: [{ id: "a" }] }] },
        ],
      };
      expect(parser.noDependencyCycle(selfRef).isOk()).toBe(false);
    });

    it("returns err when there is a simple cycle", () => {
      const cycle: StructuredPlaylistDefinitionInterface = {
        version: 1,
        name: "Cycle",
        provider: "spotify",
        user_id: "user123",
        playlists: [
          { id: "a", dependencies: [{ id: "b" }] },
          { id: "b", dependencies: [{ id: "a" }] },
        ],
      };
      expect(parser.noDependencyCycle(cycle).isOk()).toBe(false);
    });

    it("returns err when there is a longer cycle", () => {
      const longCycle: StructuredPlaylistDefinitionInterface = {
        version: 1,
        name: "Long Cycle",
        provider: "spotify",
        user_id: "user123",
        playlists: [
          { id: "a", dependencies: [{ id: "b" }] },
          { id: "b", dependencies: [{ id: "c" }] },
          { id: "c", dependencies: [{ id: "a" }] },
        ],
      };
      expect(parser.noDependencyCycle(longCycle).isOk()).toBe(false);
    });

    it("returns ok when there are no dependencies", () => {
      const noDeps: StructuredPlaylistDefinitionInterface = {
        version: 1,
        name: "No Deps",
        provider: "spotify",
        user_id: "user123",
        playlists: [{ id: "a" }, { id: "b" }],
      };
      expect(parser.noDependencyCycle(noDeps).isOk()).toBe(true);
    });

    it("returns ok when dependencies point to non-existent playlists", () => {
      const missingDeps: StructuredPlaylistDefinitionInterface = {
        version: 1,
        name: "Missing Deps",
        provider: "spotify",
        user_id: "user123",
        playlists: [{ id: "a", dependencies: [{ id: "b" }] }],
      };
      expect(parser.noDependencyCycle(missingDeps).isOk()).toBe(true);
    });
  });
});
