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
});
