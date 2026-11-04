import {
  annotateTransactionEvent,
  type RouteGrouping,
  type TelemetryLayer,
  type TransactionEventLike,
} from "@playlistwizard/shared";
import { supportedLangs } from "@/features/localization/i18n";
import { canonicalizeAppRoute } from "./app-route";

// Server transactions are named `<METHOD> <template>`, e.g. `GET /[lang]/playlists`.
const HTTP_METHOD_PREFIX = /^[A-Z]+ (?=\/)/;

// URL attributes the SDKs put on root spans, newest semantic convention first.
const ROOT_URL_ATTRIBUTES = ["url.full", "http.url", "url.path", "http.target"];

/**
 * Resolves the route group of a browser or Next.js server transaction.
 *
 * The SDK-provided transaction name is preferred for the route because it is
 * already a template on the server and is fixed when the navigation starts in
 * the browser. The request URL is the fallback for names that are not paths,
 * such as `middleware GET`, and supplies the locale when the name holds only a
 * placeholder. The browser request URL is read when the event is sent, which
 * can be after a later navigation, so it never overrides the name's route.
 */
export function resolveTransactionRoute(
  event: TransactionEventLike,
): RouteGrouping | null {
  const name = event.transaction?.replace(HTTP_METHOD_PREFIX, "");
  const fromName = name?.startsWith("/")
    ? canonicalizeAppRoute(name, supportedLangs)
    : null;

  const url = event.request?.url ?? readRootUrl(event);
  const fromUrl = url ? canonicalizeAppRoute(url, supportedLangs) : null;

  const route = fromName?.route ?? fromUrl?.route;
  if (!route) return null;
  return { route, locale: fromName?.locale ?? fromUrl?.locale };
}

/**
 * Builds a Sentry `beforeSendTransaction` hook that adds PlaylistWizard's
 * grouping attributes to every span of the transaction.
 *
 * Attributes are added at send time instead of at span start because the
 * Next.js SDK renames browser navigation spans to their parameterized route
 * after they start.
 */
export function createBeforeSendTransaction(layer: TelemetryLayer) {
  return <E extends TransactionEventLike>(event: E): E =>
    annotateTransactionEvent(event, {
      layer,
      resolveRoute: resolveTransactionRoute,
    });
}

function readRootUrl(event: TransactionEventLike): string | undefined {
  const data = event.contexts?.trace?.data;
  for (const key of ROOT_URL_ATTRIBUTES) {
    const value = data?.[key];
    if (typeof value === "string" && value) return value;
  }
  return undefined;
}
