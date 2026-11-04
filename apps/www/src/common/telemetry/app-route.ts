import { type RouteGrouping, UNMATCHED_ROUTE } from "@playlistwizard/shared";

/**
 * Canonical route templates for pages and route handlers under `app/[lang]`,
 * written without the locale segment and without route groups.
 *
 * The list is explicit instead of derived by regex so that unknown paths map to
 * a single bounded value. `app-route.test.ts` checks it against the files in
 * `src/app`, so adding a page without updating this list fails the test.
 */
export const LOCALIZED_ROUTES = [
  "/",
  "/dev/console",
  "/login",
  "/playlists",
  "/playlists/browser",
  "/privacy",
  "/search",
  "/settings",
  "/sign-in",
  "/structured-playlists/editor",
  "/terms",
  "/terms-and-privacy",
] as const;

/**
 * Canonical templates for route handlers and metadata routes outside
 * `app/[lang]`. Catch-all handlers are matched by prefix so that every sub-path
 * shares one group.
 */
export const UNLOCALIZED_ROUTES = [
  "/api/auth/[...all]",
  "/api/v1/[[...route]]",
  "/api/v1/structured-playlists/schema",
  "/api/v1/youtube-no-thumbnail",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
] as const;

const localizedRoutes = new Set<string>(LOCALIZED_ROUTES);
const unlocalizedExactRoutes = new Set<string>(
  UNLOCALIZED_ROUTES.filter((route) => !route.includes("[")),
);

// Route parameter placeholders that SDKs emit in place of the locale segment:
// Next.js server templates use `[lang]`, browser parameterization uses `:lang`.
const LOCALE_PLACEHOLDERS = new Set(["[lang]", ":lang"]);

/**
 * Maps a pathname, URL, or SDK route template to a bounded route group.
 *
 * Accepts raw paths (`/ja/playlists?fa=A&_rsc=X`), absolute URLs, and SDK
 * templates (`/[lang]/playlists`, `/:lang/playlists`). Query strings,
 * fragments, trailing slashes, and route groups never affect the result. The
 * locale is returned separately and only when the input carries a supported
 * locale value, so placeholders and unprefixed paths omit it.
 *
 * This only names telemetry. It must not be used for routing, caching, or
 * authorization decisions.
 */
export function canonicalizeAppRoute(
  input: string,
  supportedLocales: readonly string[],
): RouteGrouping {
  const segments = toPathname(input)
    .split("/")
    .filter((segment) => segment && !isRouteGroup(segment));

  const unlocalized = matchUnlocalizedRoute(segments);
  if (unlocalized) return { route: unlocalized };

  const [first, ...rest] = segments;
  if (first && supportedLocales.includes(first)) {
    return { route: matchLocalizedRoute(rest), locale: first };
  }
  if (first && LOCALE_PLACEHOLDERS.has(first)) {
    return { route: matchLocalizedRoute(rest) };
  }
  // Unprefixed paths reach the proxy before it redirects to a locale.
  return { route: matchLocalizedRoute(segments) };
}

function matchLocalizedRoute(segments: string[]): string {
  const path = `/${segments.join("/")}`;
  return localizedRoutes.has(path) ? path : UNMATCHED_ROUTE;
}

function matchUnlocalizedRoute(segments: string[]): string | null {
  const path = `/${segments.join("/")}`;
  if (unlocalizedExactRoutes.has(path)) return path;
  if (segments[0] !== "api") return null;
  if (segments[1] === "auth") return "/api/auth/[...all]";
  if (segments[1] === "v1") return "/api/v1/[[...route]]";
  return UNMATCHED_ROUTE;
}

function toPathname(input: string): string {
  const pathOrUrl = input.trim();
  try {
    return new URL(pathOrUrl).pathname;
  } catch {
    return pathOrUrl.split(/[?#]/, 1)[0];
  }
}

function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}
