/**
 * Returns the configured browser-visible API origin when available.
 * Better Auth can resolve an omitted base URL from the current request.
 */
export const getPublicApiOrigin = (): string | undefined =>
  process.env.NEXT_PUBLIC_API_URL;

/**
 * Returns the browser-visible API origin for direct HTTP and WebSocket clients.
 * The environment contract intentionally excludes versioned paths.
 */
export const requirePublicApiOrigin = (): string => {
  const origin = process.env.NEXT_PUBLIC_API_URL;
  if (!origin) throw new Error("NEXT_PUBLIC_API_URL is not set");
  return origin;
};

/**
 * Returns the server-side API origin used to generate authentication URLs.
 * Better Auth accepts an undefined base URL and resolves it from the request,
 * which keeps modules importable in tests and build-time tooling.
 */
export const getServerApiOrigin = (): string | undefined => process.env.API_URL;
