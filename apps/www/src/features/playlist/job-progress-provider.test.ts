import { describe, expect, it } from "vitest";
import { createJobProgressWebSocketUrl } from "./job-progress-provider";

describe("createJobProgressWebSocketUrl", () => {
  it("targets the v1 progress endpoint", () => {
    expect(createJobProgressWebSocketUrl("https://api.example.com")).toBe(
      "wss://api.example.com/v1/jobs/progress",
    );
  });
});
