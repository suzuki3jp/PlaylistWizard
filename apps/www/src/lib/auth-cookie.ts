export const DEFAULT_AUTH_COOKIE_PREFIX = "better-auth";

export const getAuthCookiePrefix = (): string =>
  process.env.AUTH_COOKIE_PREFIX?.trim() || DEFAULT_AUTH_COOKIE_PREFIX;
