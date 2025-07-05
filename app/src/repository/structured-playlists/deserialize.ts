import { type Result, err, ok } from "neverthrow";

import type { StructuredPlaylistDefinitionInterface } from "@/usecase/interface/structured-playlists";
import { hasDependencyCycle } from "./dependency";
import { type FieldTypeErrors, checkFieldTypes } from "./type-check";

/**
 * Deserializes a raw JSON string into a structured playlist definition
 */
export function deserialize(
  raw: string,
): Result<StructuredPlaylistDefinitionInterface, DeserializeErrorType> {
  try {
    // Parse JSON
    const json = JSON.parse(raw);

    // Check field types
    const fieldTypesResult = checkFieldTypes(json);
    if (fieldTypesResult.isErr()) {
      return err(fieldTypesResult.error);
    }

    // Cast to typed object after validation
    const typedJson = json as StructuredPlaylistDefinitionInterface;

    // Check for dependency cycles
    if (hasDependencyCycle(typedJson)) {
      return err(DeserializeError.dependencyCycle);
    }

    return ok(typedJson);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return err(DeserializeError.invalidJson);
    }
    return err(DeserializeError.unknownError);
  }
}

const DeserializeError = {
  invalidJson: "INVALID_JSON",
  dependencyCycle: "DEPENDENCY_CYCLE",
  unknownError: "UNKNOWN_ERROR",
} as const;

export type DeserializeErrorType =
  | (typeof DeserializeError)[keyof typeof DeserializeError]
  | FieldTypeErrors;
