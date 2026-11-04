import { TELEMETRY_ATTRIBUTES, UNMATCHED_ROUTE } from "@playlistwizard/shared";
import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordRouteTemplate, resolveEndpointRouteTemplate } from "./telemetry";

const { rootSpan } = vi.hoisted(() => ({
  rootSpan: { setAttribute: vi.fn() },
}));

vi.mock("@sentry/cloudflare", () => ({
  getActiveSpan: () => rootSpan,
  getRootSpan: (span: unknown) => span,
}));

const createApp = () => {
  const jobs = new Hono()
    .use("/*", async (_c, next) => next())
    .get("/progress", (c) => c.text("progress"))
    .post("/", (c) => c.text("created"));

  return new Hono().use("*", recordRouteTemplate).route(
    "/v1",
    new Hono()
      .get("/api/auth/error", (c) => c.text("auth error"))
      .on(["GET", "POST"], "/api/auth/*", (c) => c.text("auth"))
      .route("/jobs", jobs),
  );
};

describe("resolveEndpointRouteTemplate", () => {
  it("skips middleware and returns the endpoint template", () => {
    expect(
      resolveEndpointRouteTemplate([
        { method: "ALL", path: "*" },
        { method: "ALL", path: "/v1/jobs/*" },
        { method: "GET", path: "/v1/jobs/progress" },
      ]),
    ).toBe("/v1/jobs/progress");
  });

  it("prefers the earlier endpoint over a later wildcard that also matched", () => {
    expect(
      resolveEndpointRouteTemplate([
        { method: "ALL", path: "*" },
        { method: "GET", path: "/v1/api/auth/error" },
        { method: "GET", path: "/v1/api/auth/*" },
      ]),
    ).toBe("/v1/api/auth/error");
  });

  it("returns the unmatched group when no endpoint handled the request", () => {
    expect(resolveEndpointRouteTemplate([{ method: "ALL", path: "*" }])).toBe(
      UNMATCHED_ROUTE,
    );
  });
});

describe("recordRouteTemplate", () => {
  beforeEach(() => rootSpan.setAttribute.mockClear());

  it("records the template instead of the requested path and query", async () => {
    await createApp().request("/v1/jobs/progress?jobId=job-123");

    expect(rootSpan.setAttribute).toHaveBeenCalledWith(
      TELEMETRY_ATTRIBUTES.route,
      "/v1/jobs/progress",
    );
  });

  it("groups wildcard endpoints by their template", async () => {
    await createApp().request("/v1/api/auth/callback/google?code=secret");

    expect(rootSpan.setAttribute).toHaveBeenCalledWith(
      TELEMETRY_ATTRIBUTES.route,
      "/v1/api/auth/*",
    );
  });

  it("records the specific endpoint that responded before an overlapping wildcard", async () => {
    const response = await createApp().request("/v1/api/auth/error");

    expect(await response.text()).toBe("auth error");
    expect(rootSpan.setAttribute).toHaveBeenCalledWith(
      TELEMETRY_ATTRIBUTES.route,
      "/v1/api/auth/error",
    );
  });

  it("distinguishes endpoints that share a mount point by method", async () => {
    await createApp().request("/v1/jobs", { method: "POST" });

    expect(rootSpan.setAttribute).toHaveBeenCalledWith(
      TELEMETRY_ATTRIBUTES.route,
      "/v1/jobs",
    );
  });

  it("collapses unknown paths into one group", async () => {
    await createApp().request("/v1/unknown/abc123");

    expect(rootSpan.setAttribute).toHaveBeenCalledWith(
      TELEMETRY_ATTRIBUTES.route,
      UNMATCHED_ROUTE,
    );
  });
});
