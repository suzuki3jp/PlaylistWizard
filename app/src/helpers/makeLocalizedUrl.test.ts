import { describe, expect, it } from "vitest";
import { makeLocalizedUrl } from "./makeLocalizedUrl";

describe("makeLocalizedUrl", () => {
  it("should prepend the language to the path", () => {
    expect(makeLocalizedUrl("en", "about")).toBe("/en/about");
  });

  it("should handle paths that already start with a slash", () => {
    expect(makeLocalizedUrl("en", "/about")).toBe("/en/about");
  });

  it("should ensure the path starts with a slash", () => {
    expect(makeLocalizedUrl("en", "about/contact")).toBe("/en/about/contact");
  });

  it("should handle empty paths correctly", () => {
    expect(makeLocalizedUrl("en", "")).toBe("/en/");
  });
});
