import { err, ok, type Result } from "neverthrow";
import type { ZodError } from "zod";

import type { StructuredPlaylistDefinitionInterface } from "@/usecase/interface/structured-playlists";
import { hasDependencyCycle } from "./dependency";
import { StructuredPlaylistsDefinitionSchema } from "./schema";

/**
 * Deserializes a raw JSON string into a structured playlist definition
 */
export function deserialize(
  raw: string,
): Result<StructuredPlaylistDefinitionInterface, DeserializeError> {
  try {
    // Parse JSON
    const json = JSON.parse(raw);

    const typedJsonResult = StructuredPlaylistsDefinitionSchema.safeParse(json);

    if (!typedJsonResult.success) {
      // handle validation error
      return err({
        code: StructuredPlaylistsDefinitionDeserializeErrorCode.VALIDATION_ERROR,
        error: typedJsonResult.error,
      });
    }
    const typedJson = typedJsonResult.data;

    // Check for dependency cycles
    if (hasDependencyCycle(typedJson)) {
      return err({
        code: StructuredPlaylistsDefinitionDeserializeErrorCode.DEPENDENCY_CYCLE,
      });
    }

    return ok(typedJson);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return err({
        code: StructuredPlaylistsDefinitionDeserializeErrorCode.INVALID_JSON,
      });
    }
    return err({
      code: StructuredPlaylistsDefinitionDeserializeErrorCode.UNKNOWN_ERROR,
    });
  }
}

type DeserializeError =
  | {
      code: Exclude<
        StructuredPlaylistsDefinitionDeserializeErrorCode,
        StructuredPlaylistsDefinitionDeserializeErrorCode.VALIDATION_ERROR
      >;
    }
  | {
      code: StructuredPlaylistsDefinitionDeserializeErrorCode.VALIDATION_ERROR;
      error: ZodError;
    };

export enum StructuredPlaylistsDefinitionDeserializeErrorCode {
  INVALID_JSON = "INVALID_JSON",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DEPENDENCY_CYCLE = "DEPENDENCY_CYCLE",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}
