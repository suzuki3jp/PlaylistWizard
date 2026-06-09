import { describe, expect, it } from "vitest";
import {
  getCorsOrigins,
  getTrustedOrigins,
  isAllowedOrigin,
  parseBooleanEnv,
  parseCommaSeparatedList,
} from "./config";

describe("worker config helpers", () => {
  it("parses comma-separated env lists", () => {
    expect(
      parseCommaSeparatedList(" https://a.test,https://b.test ,, "),
    ).toEqual(["https://a.test", "https://b.test"]);
  });

  it("parses boolean env values", () => {
    expect(parseBooleanEnv("true")).toBe(true);
    expect(parseBooleanEnv("1")).toBe(true);
    expect(parseBooleanEnv("yes")).toBe(true);
    expect(parseBooleanEnv("false")).toBe(false);
    expect(parseBooleanEnv(undefined)).toBe(false);
  });

  it("includes the Better Auth base URL in trusted origins", () => {
    expect(
      getTrustedOrigins({
        AUTH_TRUSTED_ORIGINS: "https://playlistwizard.app",
        BETTER_AUTH_URL: "https://api.playlistwizard.app",
      }),
    ).toEqual(["https://api.playlistwizard.app", "https://playlistwizard.app"]);
  });

  it("prefers explicit API CORS origins over trusted origins", () => {
    expect(
      getCorsOrigins({
        API_CORS_ORIGINS: "https://playlistwizard.app",
        AUTH_TRUSTED_ORIGINS: "https://auth-only.test",
        BETTER_AUTH_URL: "https://api.playlistwizard.app",
      }),
    ).toEqual(["https://playlistwizard.app"]);
  });

  it("checks origins against the allowlist", () => {
    expect(
      isAllowedOrigin("https://playlistwizard.app", [
        "https://playlistwizard.app",
      ]),
    ).toBe(true);
    expect(
      isAllowedOrigin("https://evil.test", ["https://playlistwizard.app"]),
    ).toBe(false);
    expect(isAllowedOrigin(undefined, ["https://playlistwizard.app"])).toBe(
      false,
    );
  });
});
