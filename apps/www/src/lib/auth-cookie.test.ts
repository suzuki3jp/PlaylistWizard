import { afterEach, describe, expect, it, vi } from "vitest";
import { getAuthCookiePrefix } from "./auth-cookie";

describe("getAuthCookiePrefix", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the Better Auth default cookie prefix when unset", () => {
    vi.stubEnv("AUTH_COOKIE_PREFIX", "");

    expect(getAuthCookiePrefix()).toBe("better-auth");
  });

  it("uses AUTH_COOKIE_PREFIX when configured", () => {
    vi.stubEnv("AUTH_COOKIE_PREFIX", "better-auth-dev");

    expect(getAuthCookiePrefix()).toBe("better-auth-dev");
  });
});
