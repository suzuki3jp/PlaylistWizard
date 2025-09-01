import { err, ok, type Result } from "neverthrow";

import type { StructuredPlaylistsDefinition } from "./schema";

const STRUCTURED_PLAYLISTS_DEFINITION_STORAGE_KEY = "structured_playlists";

export const StructuredPlaylistsDefinitionLocalStorage = {
  set(definition: StructuredPlaylistsDefinition) {
    window.localStorage.setItem(
      STRUCTURED_PLAYLISTS_DEFINITION_STORAGE_KEY,
      JSON.stringify(definition),
    );
  },

  get(): Result<StructuredPlaylistsDefinition, NotFound | ParseError> {
    const item = window.localStorage.getItem(
      STRUCTURED_PLAYLISTS_DEFINITION_STORAGE_KEY,
    );
    if (!item) {
      return err(new NotFound("Structured playlists definition not found"));
    }

    try {
      const definition = JSON.parse(item);
      return ok(definition);
    } catch {
      return err(
        new ParseError("Failed to parse structured playlists definition"),
      );
    }
  },
};

export class NotFound extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "NotFound";
  }
}

export class ParseError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ParseError";
  }
}
