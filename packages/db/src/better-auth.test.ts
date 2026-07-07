import { describe, expect, it } from "vitest";
import {
  betterAuthUserAdditionalFieldNames,
  hasBetterAuthUserAdditionalField,
} from "./better-auth";

describe("Better Auth schema mapping", () => {
  it("maps additional user fields to Drizzle table properties", () => {
    expect(
      betterAuthUserAdditionalFieldNames.every((fieldName) =>
        hasBetterAuthUserAdditionalField(fieldName),
      ),
    ).toBe(true);
  });
});
