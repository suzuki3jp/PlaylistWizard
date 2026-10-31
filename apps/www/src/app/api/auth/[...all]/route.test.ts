import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { GET, OPTIONS, POST } from "./route";

vi.mock("@/lib/api-url", () => ({
  requirePublicApiOrigin: () => "https://api.example.com",
}));

describe("auth route", () => {
  it.each([
    ["GET", GET],
    ["POST", POST],
  ])(
    "%s redirects to the versioned API and preserves the query",
    (_method, handler) => {
      const response = handler(
        new NextRequest(
          "https://app.example.com/api/auth/sign-in/social?callbackURL=%2Fen",
        ),
      );

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://api.example.com/v1/api/auth/sign-in/social?callbackURL=%2Fen",
      );
    },
  );

  it("responds to preflight requests without redirecting", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
