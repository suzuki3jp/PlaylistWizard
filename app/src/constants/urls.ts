import { makeLocalizedUrl } from "@/presentation/common/makeLocalizedUrl";

export const BASE_URL = "https://playlistwizard.app";

export const GITHUB_REPO = "https://github.com/suzuki3jp/playlistwizard";
export const GITHUB_ISSUES = `${GITHUB_REPO}/issues`;

export const YOUTUBE_TOS = "https://www.youtube.com/t/terms";
export const GOOGLE_PRIVACY_POLICY = "https://policies.google.com/privacy";
export const GOOGLE_CONNECTIONS = "https://myaccount.google.com/connections";
export const GOOGLE_ANALYTICS_TOS =
  "https://marketingplatform.google.com/about/analytics/terms/us/";
export const GOOGLE_ANALYTICS_PRIVACY_POLICY =
  "https://policies.google.com/privacy?hl=en-US";

export const SPOTIFY_TOS = "https://www.spotify.com/legal/end-user-agreement/";
export const SPOTIFY_PRIVACY_POLICY =
  "https://www.spotify.com/legal/privacy-policy/";
export const SPOTIFY_CONNECTIONS = "https://www.spotify.com/account/apps/";

export const signIn = (lang: string, redirectTo: string) =>
  makeLocalizedUrl(lang, `/sign-in?redirect_to=${redirectTo}`);

export const signOut = (lang: string, redirectTo: string) =>
  makeLocalizedUrl(lang, `/sign-out?redirect_to=${redirectTo}`);

export const playlists = () => "/playlists";
