/**
 * Span attribute keys that PlaylistWizard adds on top of SDK-provided telemetry
 * so that browser, Next.js, and Worker observations can be grouped by the same
 * bounded keys in Sentry aggregates.
 *
 * Every value written under these keys must come from a fixed vocabulary (a
 * route template, a locale code, an operation name) and never from raw URLs,
 * query strings, identifiers, or user-supplied text, because Sentry treats each
 * distinct value as a separate group.
 */
export const TELEMETRY_ATTRIBUTES = {
  /** Locale-independent route template, e.g. `/playlists`. */
  route: "app.route",
  /** Supported locale code taken from the URL, kept apart from the route. */
  locale: "app.locale",
  /** Runtime/layer that produced the span, e.g. `browser` or `worker`. */
  layer: "app.layer",
  /** Stable application operation name, e.g. `playlists.list`. */
  operation: "app.operation",
  /** External service an outgoing HTTP request targets, e.g. `youtube`. */
  externalService: "app.external.service",
  /** Endpoint template within the external service. */
  externalEndpoint: "app.external.endpoint",
} as const;

/**
 * Runtime/layer values for {@link TELEMETRY_ATTRIBUTES.layer}. Keeping layers
 * distinct prevents browser navigation, server rendering, and Worker request
 * durations from being averaged into the same population.
 */
export type TelemetryLayer =
  | "browser"
  | "nextjs.node"
  | "nextjs.edge"
  | "worker";

/** Route value used when a path does not match any known route template. */
export const UNMATCHED_ROUTE = "unmatched";

const YOUTUBE_DATA_API_HOSTS = new Set([
  "www.googleapis.com",
  "youtube.googleapis.com",
]);
const YOUTUBE_DATA_API_PATH_PREFIX = "/youtube/v3/";

// The YouTube Data API v3 resources PlaylistWizard calls. Any other resource is
// reported as `other` so that an unexpected path cannot create new groups.
const YOUTUBE_DATA_API_RESOURCES = new Set([
  "channels",
  "playlistItems",
  "playlists",
  "search",
  "videos",
]);

/**
 * Grouping attributes for an outgoing HTTP request to an external service.
 */
export interface ExternalHttpGrouping {
  service: "youtube";
  endpoint: string;
}

/**
 * Classifies an outgoing request URL into a bounded service/endpoint group.
 *
 * Query parameters such as page tokens are ignored, so every page of the same
 * list call shares one group. Returns `null` for URLs that are not a known
 * external service so callers leave SDK attributes untouched.
 */
export function classifyExternalHttpUrl(
  url: string,
): ExternalHttpGrouping | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!YOUTUBE_DATA_API_HOSTS.has(parsed.hostname)) return null;
  if (!parsed.pathname.startsWith(YOUTUBE_DATA_API_PATH_PREFIX)) return null;

  const resource = parsed.pathname
    .slice(YOUTUBE_DATA_API_PATH_PREFIX.length)
    .split("/")[0];
  const endpoint = YOUTUBE_DATA_API_RESOURCES.has(resource)
    ? `${YOUTUBE_DATA_API_PATH_PREFIX}${resource}`
    : `${YOUTUBE_DATA_API_PATH_PREFIX}other`;

  return { service: "youtube", endpoint };
}

/**
 * The subset of a serialized span (Sentry's `SpanJSON`) that grouping reads.
 * Declared structurally so this package does not depend on a Sentry SDK.
 */
export interface SerializedSpanLike {
  op?: string;
  description?: string;
  data: Record<string, unknown>;
}

/**
 * Adds external service grouping attributes to an outgoing HTTP client span.
 *
 * SDKs put the request URL in different attributes (`url.full` in newer
 * semantic conventions, `http.url` in older ones) and the description usually
 * reads `GET https://...`, so all three are checked in that order.
 */
export function annotateExternalHttpSpan<T extends SerializedSpanLike>(
  span: T,
): T {
  if (span.op !== "http.client") return span;

  const url =
    readString(span.data["url.full"]) ??
    readString(span.data["http.url"]) ??
    span.description?.split(" ").pop();
  if (!url) return span;

  const grouping = classifyExternalHttpUrl(url);
  if (!grouping) return span;

  span.data[TELEMETRY_ATTRIBUTES.externalService] = grouping.service;
  span.data[TELEMETRY_ATTRIBUTES.externalEndpoint] = grouping.endpoint;
  return span;
}

/**
 * Route grouping for the request or navigation a transaction represents.
 */
export interface RouteGrouping {
  route: string;
  locale?: string;
}

/**
 * The subset of a Sentry transaction event that grouping reads and writes.
 * Declared structurally so this package does not depend on a Sentry SDK.
 */
export interface TransactionEventLike<
  S extends SerializedSpanLike = SerializedSpanLike,
> {
  transaction?: string;
  request?: { url?: string };
  contexts?: { trace?: { data?: Record<string, unknown> } };
  spans?: S[];
}

/**
 * Adds layer, route, and external service grouping attributes to a
 * transaction's root span and every child span it carries.
 *
 * Child spans receive the route of the request or navigation they belong to,
 * so component spans (middleware, rendering, outgoing HTTP) can be compared per
 * route without joining back to the root span. When `resolveRoute` is omitted
 * or returns `null`, a route that instrumentation already wrote to the root
 * span is reused.
 */
export function annotateTransactionEvent<E extends TransactionEventLike>(
  event: E,
  options: {
    layer: TelemetryLayer;
    resolveRoute?: (event: E) => RouteGrouping | null;
  },
): E {
  const rootData = event.contexts?.trace?.data;
  const grouping = options.resolveRoute?.(event) ?? readRouteGrouping(rootData);

  const annotate = (data: Record<string, unknown>) => {
    data[TELEMETRY_ATTRIBUTES.layer] = options.layer;
    if (!grouping) return;
    data[TELEMETRY_ATTRIBUTES.route] = grouping.route;
    if (grouping.locale) data[TELEMETRY_ATTRIBUTES.locale] = grouping.locale;
  };

  if (event.contexts?.trace) {
    event.contexts.trace.data ??= {};
    annotate(event.contexts.trace.data);
  }
  for (const span of event.spans ?? []) {
    annotateExternalHttpSpan(span);
    annotate(span.data);
  }
  return event;
}

function readRouteGrouping(
  data: Record<string, unknown> | undefined,
): RouteGrouping | null {
  const route = readString(data?.[TELEMETRY_ATTRIBUTES.route]);
  if (!route) return null;
  return { route, locale: readString(data?.[TELEMETRY_ATTRIBUTES.locale]) };
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
