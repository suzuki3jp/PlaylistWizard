import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { UNMATCHED_ROUTE } from "@playlistwizard/shared";
import { describe, expect, it } from "vitest";
import {
  canonicalizeAppRoute,
  LOCALIZED_ROUTES,
  UNLOCALIZED_ROUTES,
} from "./app-route";

const locales = ["en", "ja"];
const canonicalize = (input: string) => canonicalizeAppRoute(input, locales);

describe("canonicalizeAppRoute", () => {
  it("groups locales and query strings into one route with the locale separate", () => {
    expect(canonicalize("/ja/playlists?fa=A&_rsc=X")).toEqual({
      route: "/playlists",
      locale: "ja",
    });
    expect(canonicalize("/en/playlists?fa=B&_rsc=Y")).toEqual({
      route: "/playlists",
      locale: "en",
    });
  });

  it("maps server and browser SDK templates to the same route", () => {
    expect(canonicalize("/[lang]/playlists")).toEqual({ route: "/playlists" });
    expect(canonicalize("/:lang/playlists")).toEqual({ route: "/playlists" });
    expect(canonicalize("/[lang]/(with-nav)/playlists")).toEqual({
      route: "/playlists",
    });
  });

  it("keeps nested routes distinct from their parents", () => {
    expect(canonicalize("/en/playlists/browser?fa=A&ids=1,2").route).toBe(
      "/playlists/browser",
    );
    expect(canonicalize("/en/playlists").route).toBe("/playlists");
  });

  it("ignores fragments, trailing slashes, and URL origins", () => {
    expect(
      canonicalize("https://playlistwizard.app/ja/settings/?fa=A#section"),
    ).toEqual({ route: "/settings", locale: "ja" });
  });

  it("maps the locale root to the home route", () => {
    expect(canonicalize("/ja")).toEqual({ route: "/", locale: "ja" });
    expect(canonicalize("/[lang]")).toEqual({ route: "/" });
    expect(canonicalize("/")).toEqual({ route: "/" });
  });

  it("recognizes unprefixed paths that arrive before the locale redirect", () => {
    expect(canonicalize("/playlists?fa=A")).toEqual({ route: "/playlists" });
  });

  it("collapses unknown paths and unsupported locales into one bounded group", () => {
    expect(canonicalize("/ja/playlists/PLabc123").route).toBe(UNMATCHED_ROUTE);
    expect(canonicalize("/fr/playlists").route).toBe(UNMATCHED_ROUTE);
    expect(canonicalize("/_not-found").route).toBe(UNMATCHED_ROUTE);
    expect(canonicalize("/api/unknown").route).toBe(UNMATCHED_ROUTE);
  });

  it("groups catch-all API handlers by their template", () => {
    expect(canonicalize("/api/auth/callback/google?code=secret")).toEqual({
      route: "/api/auth/[...all]",
    });
    expect(canonicalize("/api/auth/[...all]").route).toBe("/api/auth/[...all]");
    expect(canonicalize("/api/v1/anything/else").route).toBe(
      "/api/v1/[[...route]]",
    );
    expect(canonicalize("/api/v1/youtube-no-thumbnail").route).toBe(
      "/api/v1/youtube-no-thumbnail",
    );
  });
});

describe("route lists", () => {
  const appDir = join(__dirname, "../../app");

  it("cover every page, route handler, and metadata route in the app directory", () => {
    const localized = new Set<string>();
    const unlocalized = new Set<string>();

    for (const file of listRouteFiles(appDir)) {
      const parts = relative(appDir, file).split(sep);
      const fileName = parts.pop() ?? "";
      const segments = parts.filter((segment) => !/^\(.*\)$/.test(segment));
      const metadataRoute = METADATA_ROUTE_FILES[fileName];
      if (metadataRoute) segments.push(metadataRoute);
      if (segments[0] === "[lang]") {
        localized.add(`/${segments.slice(1).join("/")}`);
      } else {
        unlocalized.add(`/${segments.join("/")}`);
      }
    }

    expect([...localized].sort()).toEqual([...LOCALIZED_ROUTES].sort());
    expect([...unlocalized].sort()).toEqual([...UNLOCALIZED_ROUTES].sort());
  });
});

// Next.js metadata route files and the URL segment each one serves.
const METADATA_ROUTE_FILES: Record<string, string> = {
  "robots.ts": "robots.txt",
  "sitemap.ts": "sitemap.xml",
};

function listRouteFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listRouteFiles(path);
    const isRouteFile =
      entry.name === "page.tsx" ||
      entry.name === "route.ts" ||
      entry.name in METADATA_ROUTE_FILES;
    return isRouteFile ? [path] : [];
  });
}
