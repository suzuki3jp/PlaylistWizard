import { describe, expect, it } from "vitest";
import { getRetryDelaySeconds } from "./handler";

describe("getRetryDelaySeconds", () => {
  it("backs off exponentially from the first delivery", () => {
    expect([1, 2, 3].map(getRetryDelaySeconds)).toEqual([10, 20, 40]);
  });

  it("caps the delay", () => {
    expect(getRetryDelaySeconds(10)).toBe(300);
  });
});
