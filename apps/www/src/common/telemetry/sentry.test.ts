import { TELEMETRY_ATTRIBUTES } from "@playlistwizard/shared";
import { describe, expect, it } from "vitest";
import { createBeforeSendTransaction, resolveTransactionRoute } from "./sentry";

describe("resolveTransactionRoute", () => {
  it("uses the server template for the route and the request URL for the locale", () => {
    expect(
      resolveTransactionRoute({
        transaction: "GET /[lang]/playlists",
        request: { url: "https://playlistwizard.app/ja/playlists?fa=A&_rsc=X" },
      }),
    ).toEqual({ route: "/playlists", locale: "ja" });
  });

  it("separates server actions on different routes but shares the route with page loads", () => {
    expect(
      resolveTransactionRoute({ transaction: "POST /[lang]/playlists" })?.route,
    ).toBe("/playlists");
    expect(
      resolveTransactionRoute({ transaction: "POST /[lang]/playlists/browser" })
        ?.route,
    ).toBe("/playlists/browser");
  });

  it("keeps the navigation route even when the request URL has moved on", () => {
    expect(
      resolveTransactionRoute({
        transaction: "/:lang/playlists",
        request: { url: "https://playlistwizard.app/en/settings" },
      }),
    ).toEqual({ route: "/playlists", locale: "en" });
  });

  it("falls back to URL attributes when the name is not a path", () => {
    expect(
      resolveTransactionRoute({
        transaction: "middleware GET",
        contexts: { trace: { data: { "http.target": "/ja/search?q=secret" } } },
      }),
    ).toEqual({ route: "/search", locale: "ja" });
  });

  it("returns null when nothing identifies a route", () => {
    expect(
      resolveTransactionRoute({ transaction: "middleware GET" }),
    ).toBeNull();
  });
});

describe("createBeforeSendTransaction", () => {
  it("annotates the root and child spans with the layer and route", () => {
    const beforeSend = createBeforeSendTransaction("browser");
    const event = beforeSend({
      transaction: "/ja/playlists",
      contexts: { trace: { data: {} } },
      spans: [
        { op: "http.client", description: "GET /ja/playlists", data: {} },
      ],
    });

    const expected = {
      [TELEMETRY_ATTRIBUTES.layer]: "browser",
      [TELEMETRY_ATTRIBUTES.route]: "/playlists",
      [TELEMETRY_ATTRIBUTES.locale]: "ja",
    };
    expect(event.contexts?.trace?.data).toEqual(expected);
    expect(event.spans?.[0].data).toEqual(expected);
  });
});
