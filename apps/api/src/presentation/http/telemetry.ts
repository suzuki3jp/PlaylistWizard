import { TELEMETRY_ATTRIBUTES, UNMATCHED_ROUTE } from "@playlistwizard/shared";
import * as Sentry from "@sentry/cloudflare";
import type { MiddlewareHandler } from "hono";
import { matchedRoutes } from "hono/route";

/**
 * Returns the route template of the endpoint that handled a request.
 *
 * Hono reports every matched route, including `use()` middleware, which is
 * registered for method `ALL`. The last method-specific route is the endpoint
 * handler. Requests that only reached middleware (404s) share one bounded
 * group instead of one group per requested path.
 */
export function resolveEndpointRouteTemplate(
  routes: readonly { method: string; path: string }[],
): string {
  for (let i = routes.length - 1; i >= 0; i--) {
    if (routes[i].method !== "ALL") return routes[i].path;
  }
  return UNMATCHED_ROUTE;
}

/**
 * Records the matched route template on the request's root span.
 *
 * `@sentry/cloudflare` names Worker request spans from the raw URL path because
 * it starts the span before Hono routes the request. The SDK name is kept, and
 * the template is added as a grouping attribute after routing so Worker
 * endpoints can be aggregated alongside the Next.js and browser layers.
 */
export const recordRouteTemplate: MiddlewareHandler = async (c, next) => {
  await next();

  const activeSpan = Sentry.getActiveSpan();
  if (!activeSpan) return;
  Sentry.getRootSpan(activeSpan).setAttribute(
    TELEMETRY_ATTRIBUTES.route,
    resolveEndpointRouteTemplate(matchedRoutes(c)),
  );
};
