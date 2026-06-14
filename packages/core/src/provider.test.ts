import { describe, expect, it } from "vitest";
import { Provider, toProvider } from "./provider";

describe("toProvider", () => {
  it("accepts a supported Provider value", () => {
    expect(toProvider("google")).toBe(Provider.GOOGLE);
  });

  it("rejects an unsupported Provider value", () => {
    expect(() => toProvider("spotify")).toThrow(
      "Unsupported provider: spotify",
    );
  });
});
