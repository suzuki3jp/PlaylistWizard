import { err, ok, type Result } from "neverthrow";
import type { ZodError } from "zod";
import {
  type StructuredPlaylistsDefinition,
  StructuredPlaylistsDefinitionSchema,
} from "./schema";

const STRUCTURED_PLAYLISTS_DEFINITION_STORAGE_KEY = "structured_playlists";

export const StructuredPlaylistsDefinitionLocalStorage = {
  set(definition: StructuredPlaylistsDefinition) {
    window.localStorage.setItem(
      STRUCTURED_PLAYLISTS_DEFINITION_STORAGE_KEY,
      JSON.stringify(definition),
    );
  },

  remove() {
    window.localStorage.removeItem(STRUCTURED_PLAYLISTS_DEFINITION_STORAGE_KEY);
  },

  get(): Result<
    StructuredPlaylistsDefinition,
    | NotFound
    | ParseError
    | ValidationError<ZodError<StructuredPlaylistsDefinition>>
  > {
    const item = window.localStorage.getItem(
      STRUCTURED_PLAYLISTS_DEFINITION_STORAGE_KEY,
    );
    if (!item) {
      return err(new NotFound("Structured playlists definition not found"));
    }

    try {
      const definition = StructuredPlaylistsDefinitionSchema.safeParse(
        JSON.parse(item),
      );
      if (definition.success) return ok(definition.data);

      return err(new ValidationError(definition.error));
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

export class ValidationError<T extends ZodError> extends Error {
  constructor(public zodError: T) {
    super("Structured playlists definition validation failed");
    this.name = "ValidationError";
  }
}
