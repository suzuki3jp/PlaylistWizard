/**
 * Announcement dismissal is stored in a cookie instead of localStorage so
 * that the server already knows whether to render the banner during SSR.
 * A client-only decision would insert the banner after hydration and push
 * the whole page down, causing layout shift (CLS).
 */
export function announcementDismissedCookie(annoucementKey: string): string {
  return `announcement-${annoucementKey}-dismissed`;
}

/** Identifier of the currently running policy-update announcement. */
export const POLICY_UPDATE_ANNOUNCEMENT_KEY = "policy-update-2026-02-21";
