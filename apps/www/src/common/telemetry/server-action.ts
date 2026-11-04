import { TELEMETRY_ATTRIBUTES } from "@playlistwizard/shared";
import * as Sentry from "@sentry/nextjs";

/**
 * Stable names for Server Actions, formatted as `<domain>.<verb>`.
 *
 * Every Server Action on a page posts to that page's URL, so the request
 * transaction (`POST /[lang]/playlists`) cannot tell actions apart. These names
 * give each action its own span group. They are part of the telemetry contract:
 * renaming one splits its history in saved Sentry queries.
 */
export type ServerActionOperation =
  | "accounts.list"
  | "accounts.list_ids"
  | "feature_flags.set_for_developer"
  | "feedback.submit"
  | "pinned_playlists.list_ids"
  | "pinned_playlists.pin"
  | "pinned_playlists.unpin"
  | "playlist_items.add"
  | "playlist_items.remove"
  | "playlist_items.update_position"
  | "playlists.create"
  | "playlists.delete"
  | "playlists.get_full"
  | "playlists.list"
  | "structured_playlists_definitions.list"
  | "structured_playlists_definitions.save"
  | "videos.search";

/**
 * Runs a Server Action body inside a span named after its stable operation.
 *
 * The span is a child of the active request span, so it inherits the request's
 * trace and route attributes instead of starting a separate trace. Some of
 * these functions are also called directly during rendering or from the proxy;
 * those calls produce the same span under the GET request, which is why the
 * operation is recorded on this span and not on the request's root span.
 * Arguments are not recorded because they carry Account and Playlist IDs.
 */
export function traceServerAction<T>(
  operation: ServerActionOperation,
  action: () => Promise<T>,
): Promise<T> {
  return Sentry.startSpan(
    {
      name: operation,
      op: "function.server_action",
      attributes: { [TELEMETRY_ATTRIBUTES.operation]: operation },
    },
    action,
  );
}
