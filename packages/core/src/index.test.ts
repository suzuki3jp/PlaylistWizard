import { describe, expect, it } from "vitest";
import {
  deserialize,
  checkFieldTypes,
  hasDependencyCycle,
  StructuredPlaylistsDefinitionDeserializeErrorCode,
  StructuredPlaylistsDefinitionTypeErrorCode,
} from "./index";

describe("@playlistwizard/core exports", () => {
  it("should export all required functions and types", () => {
    expect(typeof deserialize).toBe("function");
    expect(typeof checkFieldTypes).toBe("function");
    expect(typeof hasDependencyCycle).toBe("function");
    expect(typeof StructuredPlaylistsDefinitionDeserializeErrorCode).toBe(
      "object",
    );
    expect(typeof StructuredPlaylistsDefinitionTypeErrorCode).toBe("object");
  });

  it("should export error codes correctly", () => {
    expect(StructuredPlaylistsDefinitionDeserializeErrorCode.INVALID_JSON).toBe(
      "INVALID_JSON",
    );
    expect(
      StructuredPlaylistsDefinitionDeserializeErrorCode.DEPENDENCY_CYCLE,
    ).toBe("DEPENDENCY_CYCLE");
    expect(
      StructuredPlaylistsDefinitionDeserializeErrorCode.UNKNOWN_ERROR,
    ).toBe("UNKNOWN_ERROR");

    expect(StructuredPlaylistsDefinitionTypeErrorCode.MISSING_FIELD).toBe(
      "MISSING_FIELD",
    );
    expect(StructuredPlaylistsDefinitionTypeErrorCode.INVALID_NAME).toBe(
      "INVALID_NAME",
    );
    expect(StructuredPlaylistsDefinitionTypeErrorCode.INVALID_PROVIDER).toBe(
      "INVALID_PROVIDER",
    );
  });
});
