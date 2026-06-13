import { describe, expect, it } from "vitest";
import {
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
