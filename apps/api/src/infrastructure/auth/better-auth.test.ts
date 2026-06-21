import type { UserId } from "@playlistwizard/core/ids";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  type AuthSession,
  resolveAuthCookiePrefix,
  resolveSessionCookieName,
} from "./better-auth";

describe("auth cookie helpers", () => {
  it("uses the Better Auth default cookie prefix when unset", () => {
    expect(resolveAuthCookiePrefix()).toBe("better-auth");
    expect(resolveAuthCookiePrefix("")).toBe("better-auth");
  });

  it("uses a configured cookie prefix", () => {
    expect(resolveAuthCookiePrefix("better-auth-dev")).toBe("better-auth-dev");
  });

  it("derives secure and non-secure session cookie names from the prefix", () => {
    expect(resolveSessionCookieName("better-auth-dev")).toEqual([
      "__Secure-better-auth-dev.session_token",
      "better-auth-dev.session_token",
    ]);
  });
});

describe("authenticated session types", () => {
  it("exposes User identifiers as branded UserId values", () => {
    expectTypeOf<AuthSession["user"]["id"]>().toEqualTypeOf<UserId>();
    expectTypeOf<AuthSession["session"]["userId"]>().toEqualTypeOf<UserId>();
  });
});
