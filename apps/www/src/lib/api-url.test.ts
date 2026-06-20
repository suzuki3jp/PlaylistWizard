import { afterEach, describe, expect, it } from "vitest";
import {
  getPublicApiOrigin,
  getServerApiOrigin,
  requirePublicApiOrigin,
} from "./api-url";

const originalPublicApiUrl = process.env.NEXT_PUBLIC_API_URL;
const originalServerApiUrl = process.env.API_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_API_URL = originalPublicApiUrl;
  process.env.API_URL = originalServerApiUrl;
});

describe("API origin configuration", () => {
  it("returns the configured public API origin", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

    expect(requirePublicApiOrigin()).toBe("https://api.example.com");
  });

  it("rejects a missing public API origin before making a request", () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(() => requirePublicApiOrigin()).toThrow(
      "NEXT_PUBLIC_API_URL is not set",
    );
  });

  it("allows Better Auth to resolve a missing public API origin", () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(getPublicApiOrigin()).toBeUndefined();
  });

  it("allows Better Auth to resolve a missing server API origin", () => {
    delete process.env.API_URL;

    expect(getServerApiOrigin()).toBeUndefined();
  });
});
