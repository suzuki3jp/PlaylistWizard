import { describe, expect, it } from "vitest";
import { toVersionedAuthPath } from "./route";

describe("toVersionedAuthPath", () => {
  it("moves Better Auth routes under the v1 API prefix", () => {
    expect(toVersionedAuthPath("/api/auth/sign-in/social")).toBe(
      "/v1/api/auth/sign-in/social",
    );
  });
});
