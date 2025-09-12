import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NotFound,
  ParseError,
  StructuredPlaylistsDefinitionLocalStorage,
} from "./local-storage";
import type { StructuredPlaylistsDefinition } from "./schema";

const STORAGE_KEY = "structured_playlists";

const sampleDefinition: StructuredPlaylistsDefinition = {
  version: 1,
  name: "test",
  provider: "spotify",
  playlists: [
    { id: "p1", dependencies: [] },
    { id: "p2", dependencies: [] },
  ],
};

describe("StructuredPlaylistsDefinitionLocalStorage", () => {
  let getItemMock: ReturnType<typeof vi.fn>;
  let setItemMock: ReturnType<typeof vi.fn>;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    getItemMock = vi.fn();
    setItemMock = vi.fn();
    originalLocalStorage = globalThis.window?.localStorage;
    globalThis.window = Object.assign(globalThis.window || {}, {
      localStorage: {
        getItem: getItemMock,
        setItem: setItemMock,
      },
    });
  });

  afterEach(() => {
    globalThis.window.localStorage = originalLocalStorage;
    vi.restoreAllMocks();
  });

  it("set: should call localStorage.setItem with correct args", () => {
    StructuredPlaylistsDefinitionLocalStorage.set(sampleDefinition);
    expect(setItemMock).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify(sampleDefinition),
    );
  });

  it("get: should return NotFound error if item does not exist", () => {
    getItemMock.mockReturnValueOnce(null);
    const result = StructuredPlaylistsDefinitionLocalStorage.get();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFound);
  });

  it("get: should return ok if item is valid JSON", () => {
    getItemMock.mockReturnValueOnce(JSON.stringify(sampleDefinition));
    const result = StructuredPlaylistsDefinitionLocalStorage.get();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(sampleDefinition);
  });

  it("get: should return ParseError if item is invalid JSON", () => {
    getItemMock.mockReturnValueOnce("not-json");
    const result = StructuredPlaylistsDefinitionLocalStorage.get();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ParseError);
  });

  it("get: should return ValidationError if item is valid JSON but invalid according to schema", () => {
    // Missing required fields, e.g. no 'version', 'name', 'provider', 'playlists'
    getItemMock.mockReturnValueOnce(JSON.stringify({ foo: "bar" }));
    const result = StructuredPlaylistsDefinitionLocalStorage.get();
    expect(result.isErr()).toBe(true);
    // ValidationError is a named class, but may not be exported, so check name
    expect(result._unsafeUnwrapErr().name).toBe("ValidationError");
  });
});
