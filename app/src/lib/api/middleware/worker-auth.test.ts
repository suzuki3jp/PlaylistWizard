import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { workerAuth } from "./worker-auth";

function createApp() {
  const app = new Hono();
  app.use(workerAuth);
  app.get("/test", (c) => c.json({ ok: true }));
  return app;
}

describe("workerAuth middleware", () => {
  const originalEnv = process.env.WORKER_SECRET;

  beforeEach(() => {
    process.env.WORKER_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.WORKER_SECRET = originalEnv;
  });

  it("allows request with correct Bearer token", async () => {
    const app = createApp();
    const res = await app.request("/test", {
      headers: { Authorization: "Bearer test-secret" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("returns 401 with wrong token", async () => {
    const app = createApp();
    const res = await app.request("/test", {
      headers: { Authorization: "Bearer wrong-secret" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 with no Authorization header", async () => {
    const app = createApp();
    const res = await app.request("/test");
    expect(res.status).toBe(401);
  });

  it("returns 401 when WORKER_SECRET is not set", async () => {
    delete process.env.WORKER_SECRET;
    const app = createApp();
    const res = await app.request("/test", {
      headers: { Authorization: "Bearer test-secret" },
    });
    expect(res.status).toBe(401);
  });
});
