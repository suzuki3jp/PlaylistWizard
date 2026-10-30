import { makeLocalizedUrl } from "@/components/makeLocalizedUrl";
import { focusedAccount } from "./search-params";

export const BASE_URL = "https://playlistwizard.app";

export const GITHUB_REPO = "https://github.com/suzuki3jp/playlistwizard";
export const GITHUB_ISSUES = `${GITHUB_REPO}/issues`;
export const CONTACT_EMAIL = "mailto:hey@playlistwizard.app";

export const YOUTUBE_TOS = "https://www.youtube.com/t/terms";
export const GOOGLE_PRIVACY_POLICY = "https://policies.google.com/privacy";
export const GOOGLE_CONNECTIONS = "https://myaccount.google.com/connections";
export const GOOGLE_ANALYTICS_TOS =
  "https://marketingplatform.google.com/about/analytics/terms/us/";
export const GOOGLE_ANALYTICS_PRIVACY_POLICY =
  "https://policies.google.com/privacy?hl=en-US";

export const signIn = (lang: string, redirectTo: string) =>
  makeLocalizedUrl(lang, `/sign-in?redirect_to=${redirectTo}`);

export const home = (lang: string) => makeLocalizedUrl(lang, "/");
export const homeFeatures = (lang: string) =>
  makeLocalizedUrl(lang, "/#features");
export const homeFaq = (lang: string) => makeLocalizedUrl(lang, "/#faq");

/**
 * Appends the non-empty entries of `query` to `path` as a query string.
 */
function withQuery(
  path: string,
  query: Record<string, string | null | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

// Locale-less paths are for sign-in return destinations: the sign-in page
// localizes `redirect_to` with its own language, which may differ from the
// language of the page that linked to it.
export const playlistsPath = "/playlists";
export const structuredPlaylistsEditorPath = "/structured-playlists/editor";
export const settingsPath = "/settings";
export const devConsolePath = "/dev/console";

// Account-scoped page URLs below take the focused Account ID and always carry
// a locale. A URL missing either is redirected by proxy.ts (locale first, then
// the default focused Account), and the default Account may differ from the
// one the user was looking at.

export const playlists = (lang: string, focusedAccountId?: string | null) =>
  withQuery(makeLocalizedUrl(lang, playlistsPath), {
    [focusedAccount]: focusedAccountId,
  });

export const playlistBrowser = (
  lang: string,
  playlistIds: string[],
  focusedAccountId?: string | null,
) =>
  withQuery(makeLocalizedUrl(lang, "/playlists/browser"), {
    ids: playlistIds.join(","),
    [focusedAccount]: focusedAccountId,
  });

export const search = (
  lang: string,
  query: string,
  focusedAccountId?: string | null,
) =>
  withQuery(makeLocalizedUrl(lang, "/search"), {
    q: query,
    [focusedAccount]: focusedAccountId,
  });

export const structuredPlaylistsEditor = (
  lang: string,
  focusedAccountId?: string | null,
) =>
  withQuery(makeLocalizedUrl(lang, structuredPlaylistsEditorPath), {
    [focusedAccount]: focusedAccountId,
  });

export const settings = (lang: string, focusedAccountId?: string | null) =>
  withQuery(makeLocalizedUrl(lang, settingsPath), {
    [focusedAccount]: focusedAccountId,
  });

export const terms = (lang: string) => makeLocalizedUrl(lang, "/terms");
export const privacy = (lang: string) => makeLocalizedUrl(lang, "/privacy");

export const youtubeApiNoThumbnail = () =>
  `https://i.ytimg.com/img/no_thumbnail.jpg`;

export const youtubeNoThumbnailProxy = () => `/api/v1/youtube-no-thumbnail`;

export const youtubeWatch = (videoId: string) =>
  `https://www.youtube.com/watch?v=${videoId}`;
