import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { Env } from "../../env";
import { authError, renderAuthErrorPage } from "./auth-error";

const env = {
  SENTRY_ENVIRONMENT: "local",
} as Env;

describe("auth error page", () => {
  it("renders a generic auth error page and the GitHub Issue path", () => {
    const html = renderAuthErrorPage();

    expect(html).toContain("Oops! Something Went Wrong");
    expect(html).toContain(
      "We're sorry, but something unexpected happened. Please try again in a moment.",
    );
    expect(html).toContain("issues/new?template=bug.yml");
  });

  it("does not render Better Auth error details", () => {
    const html = renderAuthErrorPage();

    expect(html).not.toContain("エラー詳細:");
    expect(html).not.toContain("invalid_code");
    expect(html).not.toContain("OAuth failed");
  });

  it("handles the Better Auth error endpoint without creating auth state", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.get("/api/auth/error", authError);

    const response = await app.request(
      "/api/auth/error?error=no_code&error_description=Missing%20code",
      undefined,
      env,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).not.toContain("no_code");
    expect(html).not.toContain("Missing code");
  });
});
