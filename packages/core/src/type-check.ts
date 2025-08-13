import { isNullish } from "@playlistwizard/shared";
import { type Result, err, ok } from "neverthrow";

/**
 * Checks the field types of a structured playlists definition JSON file
 */
export function checkFieldTypes(
  json: Record<string, unknown>,
): Result<void, StructuredPlaylistsDefinitionTypeErrorCode> {
  // Check required fields
  const REQUIRED_FIELDS = [
    "version",
    "name",
    "provider",
    "user_id",
    "playlists",
  ];
  if (REQUIRED_FIELDS.some((field) => isNullish(json[field]))) {
    return err(StructuredPlaylistsDefinitionTypeErrorCode.MISSING_FIELD);
  }

  // Check field types
  const SUPPORTED_VERSIONS = [1];
  const SUPPORTED_PROVIDER = ["google", "spotify"];

  if (!SUPPORTED_VERSIONS.includes(json.version as number)) {
    return err(StructuredPlaylistsDefinitionTypeErrorCode.UNSUPPORTED_VERSION);
  }
  if (typeof json.name !== "string") {
    return err(StructuredPlaylistsDefinitionTypeErrorCode.INVALID_NAME);
  }
  if (!SUPPORTED_PROVIDER.includes(json.provider as string)) {
    return err(StructuredPlaylistsDefinitionTypeErrorCode.INVALID_PROVIDER);
  }
  if (typeof json.user_id !== "string") {
    return err(StructuredPlaylistsDefinitionTypeErrorCode.INVALID_USER_ID);
  }
  if (!Array.isArray(json.playlists)) {
    return err(StructuredPlaylistsDefinitionTypeErrorCode.INVALID_PLAYLISTS);
  }

  // Check playlists types
  const playlistsCheck = checkPlaylistTypes(json.playlists);
  if (playlistsCheck.isErr()) {
    return err(playlistsCheck.error);
  }

  return ok(undefined);
}

function checkPlaylistTypes(
  playlists: unknown[],
): Result<void, StructuredPlaylistsDefinitionTypeErrorCode> {
  for (let i = 0; i < playlists.length; i++) {
    const playlist = playlists[i];

    if (typeof playlist !== "object" || playlist === null) {
      return err(
        StructuredPlaylistsDefinitionTypeErrorCode.INVALID_PLAYLIST_STRUCTURE,
      );
    }

    const playlistObj = playlist as Record<string, unknown>;

    // Check required id field
    if (typeof playlistObj.id !== "string") {
      return err(
        StructuredPlaylistsDefinitionTypeErrorCode.INVALID_PLAYLIST_ID,
      );
    }

    // Check dependencies if present
    if (playlistObj.dependencies !== undefined) {
      if (!Array.isArray(playlistObj.dependencies)) {
        return err(
          StructuredPlaylistsDefinitionTypeErrorCode.INVALID_PLAYLIST_DEPENDENCIES,
        );
      }

      // Recursively check dependencies
      const dependenciesCheck = checkPlaylistTypes(playlistObj.dependencies);
      if (dependenciesCheck.isErr()) {
        return err(dependenciesCheck.error);
      }
    }
  }

  return ok(undefined);
}

/**
 * Error codes for structured playlist definition type checking
 */
export enum StructuredPlaylistsDefinitionTypeErrorCode {
  UNSUPPORTED_VERSION = "UNSUPPORTED_VERSION",
  MISSING_FIELD = "MISSING_FIELD",
  INVALID_VERSION = "INVALID_VERSION",
  INVALID_NAME = "INVALID_NAME",
  INVALID_PROVIDER = "INVALID_PROVIDER",
  INVALID_USER_ID = "INVALID_USER_ID",
  INVALID_PLAYLISTS = "INVALID_PLAYLISTS",
  INVALID_PLAYLIST_STRUCTURE = "INVALID_PLAYLIST_STRUCTURE",
  INVALID_PLAYLIST_ID = "INVALID_PLAYLIST_ID",
  INVALID_PLAYLIST_DEPENDENCIES = "INVALID_PLAYLIST_DEPENDENCIES",
}
