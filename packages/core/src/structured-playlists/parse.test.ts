import { describe, expect, it } from "vitest";
import { parseStructuredPlaylistsDefinition } from "./parse";

const base = { version: 1, name: "Definition", provider: "google" } as const;

describe("parseStructuredPlaylistsDefinition", () => {
  it("returns the parsed Definition without unknown fields", () => {
    expect(
      parseStructuredPlaylistsDefinition({
        ...base,
        extra: "ignored",
        playlists: [{ id: "target", dependencies: [{ id: "source" }] }],
      }),
    ).toEqual({
      ...base,
      playlists: [{ id: "target", dependencies: [{ id: "source" }] }],
    });
  });

  it("rejects input that does not match the Definition schema", () => {
    expect(
      parseStructuredPlaylistsDefinition({ ...base, provider: "spotify" }),
    ).toBeNull();
    expect(parseStructuredPlaylistsDefinition("not a definition")).toBeNull();
  });

  it("rejects Definitions with a Dependency cycle", () => {
    expect(
      parseStructuredPlaylistsDefinition({
        ...base,
        playlists: [
          { id: "a", dependencies: [{ id: "b" }] },
          { id: "b", dependencies: [{ id: "a" }] },
        ],
      }),
    ).toBeNull();
  });

  it("rejects Definitions with invalid Dependency placement", () => {
    expect(
      parseStructuredPlaylistsDefinition({
        ...base,
        playlists: [{ id: "a", dependencies: [{ id: "b" }, { id: "b" }] }],
      }),
    ).toBeNull();
  });
});
