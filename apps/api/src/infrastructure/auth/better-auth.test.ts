import type { UserId } from "@playlistwizard/core/ids";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  type AuthSession,
  betterAuthLogger,
  resolveAuthCookiePrefix,
  resolveSessionCookieName,
} from "./better-auth";

const sentryMocks = vi.hoisted(() => {
  const scope = {
    setContext: vi.fn(),
    setTag: vi.fn(),
  };

  return {
    captureException: vi.fn(),
    scope,
    withScope: vi.fn((callback: (scopeArg: typeof scope) => void) => {
      callback(scope);
    }),
  };
});

vi.mock("@sentry/cloudflare", () => ({
  captureException: sentryMocks.captureException,
  withScope: sentryMocks.withScope,
}));

beforeEach(() => {
  sentryMocks.captureException.mockClear();
  sentryMocks.scope.setContext.mockClear();
  sentryMocks.scope.setTag.mockClear();
  sentryMocks.withScope.mockClear();
});

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

describe("Better Auth observability", () => {
  it("captures Better Auth error logs in Sentry without raw object values", () => {
    const error = new Error("database schema mismatch");

    betterAuthLogger.log("error", "Failed to create user", error, {
      code: "oauth-code",
      state: "oauth-state",
    });

    expect(sentryMocks.scope.setTag).toHaveBeenCalledWith(
      "component",
      "better-auth",
    );
    expect(sentryMocks.scope.setTag).toHaveBeenCalledWith(
      "auth_system",
      "better-auth",
    );
    expect(sentryMocks.scope.setContext).toHaveBeenCalledWith("better_auth", {
      message: "Failed to create user",
      args: [
        expect.objectContaining({
          message: "database schema mismatch",
          name: "Error",
          type: "Error",
        }),
        {
          keys: ["code", "state"],
          type: "Object",
        },
      ],
    });
    expect(sentryMocks.captureException).toHaveBeenCalledWith(error);
  });
});

describe("authenticated session types", () => {
  it("exposes User identifiers as branded UserId values", () => {
    expectTypeOf<AuthSession["user"]["id"]>().toEqualTypeOf<UserId>();
    expectTypeOf<AuthSession["session"]["userId"]>().toEqualTypeOf<UserId>();
  });
});
