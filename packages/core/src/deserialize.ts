import { type Result, err, ok } from "neverthrow";

import type { StructuredPlaylistDefinitionInterface } from "./types";
import { hasDependencyCycle } from "./dependency";
import {
  type StructuredPlaylistsDefinitionTypeErrorCode,
  checkFieldTypes,
} from "./type-check";

/**
 * Deserializes a raw JSON string into a structured playlist definition
 */
export function deserialize(
  raw: string,
): Result<
  StructuredPlaylistDefinitionInterface,
  | StructuredPlaylistsDefinitionDeserializeErrorCode
  | StructuredPlaylistsDefinitionTypeErrorCode
> {
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
      return err(
        StructuredPlaylistsDefinitionDeserializeErrorCode.DEPENDENCY_CYCLE,
      );
    }

    return ok(typedJson);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return err(
        StructuredPlaylistsDefinitionDeserializeErrorCode.INVALID_JSON,
      );
    }
    return err(StructuredPlaylistsDefinitionDeserializeErrorCode.UNKNOWN_ERROR);
  }
}

export enum StructuredPlaylistsDefinitionDeserializeErrorCode {
  INVALID_JSON = "INVALID_JSON",
  DEPENDENCY_CYCLE = "DEPENDENCY_CYCLE",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}
