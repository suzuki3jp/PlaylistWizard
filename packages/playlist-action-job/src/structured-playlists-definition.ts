import {
  parseStructuredPlaylistsDefinition,
  type StructuredPlaylistsDefinition,
} from "@playlistwizard/core/structured-playlists";
import * as v from "valibot";

/**
 * Valibot bridge for the core Structured Playlists Definition rules, used by
 * Job contracts that carry a Definition snapshot. Acceptance (schema and
 * Dependency graph rules) is delegated to core so request validation and
 * persisted payload validation cannot drift from the editor's rules. The output
 * is the core-parsed Definition, so unknown fields are not persisted.
 */
export const structuredPlaylistsDefinitionSchema = v.pipe(
  v.custom<StructuredPlaylistsDefinition>(
    (input) => parseStructuredPlaylistsDefinition(input) !== null,
    "Invalid Structured Playlists Definition",
  ),
  v.transform(
    (input) =>
      parseStructuredPlaylistsDefinition(
        input,
      ) as StructuredPlaylistsDefinition,
  ),
);
