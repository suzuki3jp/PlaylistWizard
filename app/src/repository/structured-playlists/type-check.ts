import { isNullish } from "@playlistwizard/shared";
import { type Result, err, ok } from "neverthrow";

/**
 * Checks the field types of a structured playlists definition JSON file
 */
export function checkFieldTypes(
  json: Record<string, unknown>,
): Result<void, FieldTypeErrors> {
  // Check required fields
  const REQUIRED_FIELDS = [
    "version",
    "name",
    "provider",
    "user_id",
    "playlists",
  ];
  if (REQUIRED_FIELDS.some((field) => isNullish(json[field]))) {
    return err(FieldTypeError.missingField);
  }

  // Check field types
  const SUPPORTED_VERSIONS = [1];
  const SUPPORTED_PROVIDER = ["google", "spotify"];

  if (!SUPPORTED_VERSIONS.includes(json.version as number)) {
    return err(FieldTypeError.unsupportedVersion);
  }
  if (typeof json.name !== "string") {
    return err(FieldTypeError.invalidName);
  }
  if (!SUPPORTED_PROVIDER.includes(json.provider as string)) {
    return err(FieldTypeError.invalidProvider);
  }
  if (typeof json.user_id !== "string") {
    return err(FieldTypeError.invalidUserId);
  }
  if (!Array.isArray(json.playlists)) {
    return err(FieldTypeError.invalidPlaylists);
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
): Result<void, FieldTypeErrors> {
  for (let i = 0; i < playlists.length; i++) {
    const playlist = playlists[i];

    if (typeof playlist !== "object" || playlist === null) {
      return err(FieldTypeError.invalidPlaylistStructure);
    }

    const playlistObj = playlist as Record<string, unknown>;

    // Check required id field
    if (typeof playlistObj.id !== "string") {
      return err(FieldTypeError.invalidPlaylistId);
    }

    // Check dependencies if present
    if (playlistObj.dependencies !== undefined) {
      if (!Array.isArray(playlistObj.dependencies)) {
        return err(FieldTypeError.invalidPlaylistDependencies);
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

const FieldTypeError = {
  unsupportedVersion: "UNSUPPORTED_VERSION",
  missingField: "MISSING_FIELD",
  invalidVersion: "INVALID_VERSION",
  invalidName: "INVALID_NAME",
  invalidProvider: "INVALID_PROVIDER",
  invalidUserId: "INVALID_USER_ID",
  invalidPlaylists: "INVALID_PLAYLISTS",
  invalidPlaylistStructure: "INVALID_PLAYLIST_STRUCTURE",
  invalidPlaylistId: "INVALID_PLAYLIST_ID",
  invalidPlaylistDependencies: "INVALID_PLAYLIST_DEPENDENCIES",
} as const;

export type FieldTypeErrors =
  (typeof FieldTypeError)[keyof typeof FieldTypeError];
