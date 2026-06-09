import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { Env } from "./env";
import {
  isStateChangingMethod,
  requireTrustedOriginForMutation,
} from "./middleware";

const env = {
  API_CORS_ORIGINS: "https://read-only.playlistwizard.app",
  AUTH_TRUSTED_ORIGINS: "https://playlistwizard.app",
  BETTER_AUTH_URL: "https://api.playlistwizard.app",
} as Env;

const createApp = () => {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", requireTrustedOriginForMutation);
  app.get("/jobs/create", (c) => c.text("OK"));
  app.post("/jobs/create", (c) => c.text("OK"));
  return app;
};

describe("worker middleware", () => {
  it("detects state-changing methods", () => {
    expect(isStateChangingMethod("GET")).toBe(false);
    expect(isStateChangingMethod("POST")).toBe(true);
    expect(isStateChangingMethod("patch")).toBe(true);
  });

  it("allows state-changing requests from an allowed Origin", async () => {
    const response = await createApp().request(
      "/jobs/create",
      {
        headers: { Origin: "https://playlistwizard.app" },
        method: "POST",
      },
      env,
    );

    expect(response.status).toBe(200);
  });

  it("rejects state-changing requests without an allowed Origin", async () => {
    const response = await createApp().request(
      "/jobs/create",
      {
        headers: { Origin: "https://evil.test" },
        method: "POST",
      },
      env,
    );

    expect(response.status).toBe(403);
  });

  it("rejects state-changing requests without an Origin", async () => {
    const response = await createApp().request(
      "/jobs/create",
      { method: "POST" },
      env,
    );

    expect(response.status).toBe(403);
  });

  it("does not trust CORS-only origins for state-changing requests", async () => {
    const response = await createApp().request(
      "/jobs/create",
      {
        headers: { Origin: "https://read-only.playlistwizard.app" },
        method: "POST",
      },
      env,
    );

    expect(response.status).toBe(403);
  });

  it("does not require Origin for read-only requests", async () => {
    const response = await createApp().request(
      "/jobs/create",
      { method: "GET" },
      env,
    );

    expect(response.status).toBe(200);
  });
});
