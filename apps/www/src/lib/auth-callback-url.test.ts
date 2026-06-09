import { describe, expect, it } from "vitest";
import { makeAuthCallbackUrl } from "./auth-callback-url";

describe("makeAuthCallbackUrl", () => {
  it("resolves relative callback paths against the current browser origin", () => {
    expect(makeAuthCallbackUrl("/en/playlists")).toBe(
      `${window.location.origin}/en/playlists`,
    );
  });
});
